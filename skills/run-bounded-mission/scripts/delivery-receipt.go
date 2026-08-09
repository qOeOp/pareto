package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"os"
	"os/exec"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"unicode/utf16"
	"unicode/utf8"
)

const (
	inputSchema    = "delivery-barrier-input/v3"
	evidenceSchema = "delivery-barrier-evidence/v3"
	receiptSchema  = "delivery-barrier-receipt/v3"
	maxSafeInteger = int64(9007199254740991)
)

var (
	evidenceKinds     = []string{"real_consumer", "root", "audit", "ci", "conversation", "drift"}
	oidPattern        = regexp.MustCompile(`^[0-9a-f]{40}([0-9a-f]{24})?$`)
	sha256Pattern     = regexp.MustCompile(`^sha256:[0-9a-f]{64}$`)
	repositoryPattern = regexp.MustCompile(
		`^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)/([a-zA-Z0-9._-]{1,100})$`,
	)
)

func fail(message string) error { return errors.New(message) }

func object(value any) (map[string]any, bool) {
	result, ok := value.(map[string]any)
	return result, ok
}

func hasExactKeys(value map[string]any, expected ...string) bool {
	if len(value) != len(expected) {
		return false
	}
	for _, key := range expected {
		if _, ok := value[key]; !ok {
			return false
		}
	}
	return true
}

func isOID(value any) bool {
	text, ok := value.(string)
	return ok && oidPattern.MatchString(text)
}

func isSHA256(value any) bool {
	text, ok := value.(string)
	return ok && sha256Pattern.MatchString(text)
}

func safePositiveInteger(value any) (int64, bool) {
	number, ok := value.(json.Number)
	if !ok {
		return 0, false
	}
	numeric, err := strconv.ParseFloat(number.String(), 64)
	if err != nil || numeric <= 0 || numeric > float64(maxSafeInteger) || math.Trunc(numeric) != numeric {
		return 0, false
	}
	return int64(numeric), true
}

func isBoundedAtom(value any, maximum int) bool {
	text, ok := value.(string)
	if !ok || text == "" || len(utf16.Encode([]rune(text))) > maximum {
		return false
	}
	for _, character := range text {
		if character <= 31 || character == 127 {
			return false
		}
	}
	return true
}

func isBaseRef(value any) bool {
	text, ok := value.(string)
	if !ok || !isBoundedAtom(text, 255) || text == "@" ||
		strings.HasPrefix(text, "-") || strings.HasPrefix(text, "/") ||
		strings.HasSuffix(text, "/") || strings.HasSuffix(text, ".") ||
		strings.Contains(text, "//") || strings.Contains(text, "..") ||
		strings.Contains(text, "@{") || strings.ContainsAny(text, " ~^:?*[]\\") {
		return false
	}
	for _, part := range strings.Split(text, "/") {
		if part == "" || strings.HasPrefix(part, ".") || strings.HasSuffix(part, ".lock") {
			return false
		}
	}
	return true
}

func normalizeRepository(value any) (string, error) {
	text, ok := value.(string)
	if !ok {
		return "", fail("repository must be owner/name")
	}
	match := repositoryPattern.FindStringSubmatch(text)
	if match == nil || match[2] == "." || match[2] == ".." {
		return "", fail("repository must be owner/name")
	}
	return strings.ToLower(match[1] + "/" + match[2]), nil
}

func appendJSONString(output []byte, value string) []byte {
	output = append(output, '"')
	for _, character := range value {
		switch character {
		case '"', '\\':
			output = append(output, '\\', byte(character))
		case '\b':
			output = append(output, `\b`...)
		case '\t':
			output = append(output, `\t`...)
		case '\n':
			output = append(output, `\n`...)
		case '\f':
			output = append(output, `\f`...)
		case '\r':
			output = append(output, `\r`...)
		default:
			if character < 0x20 {
				output = append(output, fmt.Sprintf(`\u%04x`, character)...)
			} else {
				output = utf8.AppendRune(output, character)
			}
		}
	}
	return append(output, '"')
}

func compareUTF16(left, right string) int {
	leftUnits := utf16.Encode([]rune(left))
	rightUnits := utf16.Encode([]rune(right))
	limit := len(leftUnits)
	if len(rightUnits) < limit {
		limit = len(rightUnits)
	}
	for index := 0; index < limit; index++ {
		if leftUnits[index] < rightUnits[index] {
			return -1
		}
		if leftUnits[index] > rightUnits[index] {
			return 1
		}
	}
	if len(leftUnits) < len(rightUnits) {
		return -1
	}
	if len(leftUnits) > len(rightUnits) {
		return 1
	}
	return 0
}

func appendCanonicalJSON(output []byte, value any) ([]byte, error) {
	switch current := value.(type) {
	case nil:
		return append(output, "null"...), nil
	case bool:
		return strconv.AppendBool(output, current), nil
	case string:
		return appendJSONString(output, current), nil
	case json.Number:
		return append(output, current.String()...), nil
	case int:
		return strconv.AppendInt(output, int64(current), 10), nil
	case int64:
		return strconv.AppendInt(output, current, 10), nil
	case []any:
		output = append(output, '[')
		for index, entry := range current {
			if index > 0 {
				output = append(output, ',')
			}
			var err error
			output, err = appendCanonicalJSON(output, entry)
			if err != nil {
				return nil, err
			}
		}
		return append(output, ']'), nil
	case map[string]any:
		keys := make([]string, 0, len(current))
		for key := range current {
			keys = append(keys, key)
		}
		sort.Slice(keys, func(left, right int) bool {
			return compareUTF16(keys[left], keys[right]) < 0
		})
		output = append(output, '{')
		for index, key := range keys {
			if index > 0 {
				output = append(output, ',')
			}
			output = appendJSONString(output, key)
			output = append(output, ':')
			var err error
			output, err = appendCanonicalJSON(output, current[key])
			if err != nil {
				return nil, err
			}
		}
		return append(output, '}'), nil
	default:
		return nil, fail("canonical JSON contains an unsupported value")
	}
}

func canonicalLine(value any) ([]byte, error) {
	result, err := appendCanonicalJSON(nil, value)
	if err != nil {
		return nil, err
	}
	return append(result, '\n'), nil
}

type jsonSyntax struct {
	source []byte
	offset int
}

func (parser *jsonSyntax) skipWhitespace() {
	for parser.offset < len(parser.source) {
		switch parser.source[parser.offset] {
		case ' ', '\t', '\n', '\r':
			parser.offset++
		default:
			return
		}
	}
}

func (parser *jsonSyntax) readString() (string, error) {
	start := parser.offset
	if parser.offset >= len(parser.source) || parser.source[parser.offset] != '"' {
		return "", fail("delivery input is not valid JSON")
	}
	parser.offset++
	for parser.offset < len(parser.source) {
		character := parser.source[parser.offset]
		if character < 0x20 {
			return "", fail("delivery input is not valid JSON")
		}
		if character == '"' {
			parser.offset++
			var decoded string
			if json.Unmarshal(parser.source[start:parser.offset], &decoded) != nil {
				return "", fail("delivery input is not valid JSON")
			}
			return decoded, nil
		}
		if character != '\\' {
			parser.offset++
			continue
		}
		parser.offset++
		if parser.offset >= len(parser.source) {
			return "", fail("delivery input is not valid JSON")
		}
		escape := parser.source[parser.offset]
		if strings.ContainsRune(`"\\/bfnrt`, rune(escape)) {
			parser.offset++
			continue
		}
		if escape != 'u' || parser.offset+5 > len(parser.source) {
			return "", fail("delivery input is not valid JSON")
		}
		unit, err := strconv.ParseUint(string(parser.source[parser.offset+1:parser.offset+5]), 16, 16)
		if err != nil {
			return "", fail("delivery input is not valid JSON")
		}
		parser.offset += 5
		if unit >= 0xd800 && unit <= 0xdbff {
			if parser.offset+6 > len(parser.source) || parser.source[parser.offset] != '\\' ||
				parser.source[parser.offset+1] != 'u' {
				return "", fail("delivery input is not valid JSON")
			}
			low, lowErr := strconv.ParseUint(string(parser.source[parser.offset+2:parser.offset+6]), 16, 16)
			if lowErr != nil || low < 0xdc00 || low > 0xdfff {
				return "", fail("delivery input is not valid JSON")
			}
			parser.offset += 6
		} else if unit >= 0xdc00 && unit <= 0xdfff {
			return "", fail("delivery input is not valid JSON")
		}
	}
	return "", fail("delivery input is not valid JSON")
}

func (parser *jsonSyntax) readValue() error {
	parser.skipWhitespace()
	if parser.offset >= len(parser.source) {
		return fail("delivery input is not valid JSON")
	}
	switch parser.source[parser.offset] {
	case '{':
		parser.offset++
		keys := map[string]struct{}{}
		parser.skipWhitespace()
		if parser.offset < len(parser.source) && parser.source[parser.offset] == '}' {
			parser.offset++
			return nil
		}
		for {
			parser.skipWhitespace()
			key, err := parser.readString()
			if err != nil {
				return err
			}
			if _, exists := keys[key]; exists {
				return fmt.Errorf("delivery input has duplicate member %q", key)
			}
			keys[key] = struct{}{}
			parser.skipWhitespace()
			if parser.offset >= len(parser.source) || parser.source[parser.offset] != ':' {
				return fail("delivery input is not valid JSON")
			}
			parser.offset++
			if err := parser.readValue(); err != nil {
				return err
			}
			parser.skipWhitespace()
			if parser.offset < len(parser.source) && parser.source[parser.offset] == '}' {
				parser.offset++
				return nil
			}
			if parser.offset >= len(parser.source) || parser.source[parser.offset] != ',' {
				return fail("delivery input is not valid JSON")
			}
			parser.offset++
		}
	case '[':
		parser.offset++
		parser.skipWhitespace()
		if parser.offset < len(parser.source) && parser.source[parser.offset] == ']' {
			parser.offset++
			return nil
		}
		for {
			if err := parser.readValue(); err != nil {
				return err
			}
			parser.skipWhitespace()
			if parser.offset < len(parser.source) && parser.source[parser.offset] == ']' {
				parser.offset++
				return nil
			}
			if parser.offset >= len(parser.source) || parser.source[parser.offset] != ',' {
				return fail("delivery input is not valid JSON")
			}
			parser.offset++
		}
	case '"':
		_, err := parser.readString()
		return err
	default:
		start := parser.offset
		for parser.offset < len(parser.source) && !bytes.ContainsRune([]byte("\t\n\r ,]}"), rune(parser.source[parser.offset])) {
			parser.offset++
		}
		if parser.offset == start {
			return fail("delivery input is not valid JSON")
		}
		return nil
	}
}

func decodeJSON(source []byte) (any, error) {
	decoder := json.NewDecoder(bytes.NewReader(source))
	decoder.UseNumber()
	var value any
	if err := decoder.Decode(&value); err != nil {
		return nil, err
	}
	if err := decoder.Decode(new(any)); err != io.EOF {
		return nil, fail("trailing JSON data")
	}
	return value, nil
}

func parseInput(source []byte) (any, error) {
	if !utf8.Valid(source) {
		return nil, fail("delivery input is not valid UTF-8")
	}
	if len(bytes.TrimSpace(source)) == 0 {
		return nil, fail("delivery input is empty")
	}
	parser := jsonSyntax{source: source}
	if err := parser.readValue(); err != nil {
		return nil, err
	}
	parser.skipWhitespace()
	if parser.offset != len(source) {
		return nil, fail("delivery input is not valid JSON")
	}
	value, err := decodeJSON(source)
	if err != nil {
		return nil, fail("delivery input is not valid JSON")
	}
	return value, nil
}

func parseCanonicalLine(source []byte, label string) (any, error) {
	if !utf8.Valid(source) {
		return nil, fmt.Errorf("%s is not valid UTF-8", label)
	}
	if len(source) == 0 || source[len(source)-1] != '\n' || bytes.Contains(source[:len(source)-1], []byte{'\n'}) {
		return nil, fmt.Errorf("%s must be one canonical JSON-LF record", label)
	}
	value, err := decodeJSON(source[:len(source)-1])
	if err != nil {
		return nil, fmt.Errorf("%s is not valid JSON", label)
	}
	canonical, err := canonicalLine(value)
	if err != nil || !bytes.Equal(canonical, source) {
		return nil, fmt.Errorf("%s is not canonical JSON-LF", label)
	}
	return value, nil
}

func gitOutput(arguments ...string) string {
	command := exec.Command("git", arguments...)
	output, err := command.Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(output))
}

func commitTree(oid string) string {
	if gitOutput("cat-file", "-t", oid) != "commit" {
		return ""
	}
	tree := gitOutput("rev-parse", "--verify", "--end-of-options", oid+"^{tree}")
	if !oidPattern.MatchString(tree) {
		return ""
	}
	return tree
}

func mergeTree(baseOID, headOID string) string {
	tree := gitOutput("merge-tree", "--write-tree", baseOID, headOID)
	if !oidPattern.MatchString(tree) || gitOutput("cat-file", "-t", tree) != "tree" {
		return ""
	}
	return tree
}

func normalizeEvidence(value any, headOID string) ([]any, error) {
	entries, ok := value.([]any)
	if !ok || len(entries) < len(evidenceKinds) || len(entries) > 24 {
		return nil, fail("evidence must contain the bounded required kinds")
	}
	order := map[string]int{}
	for index, kind := range evidenceKinds {
		order[kind] = index
	}
	seen := map[string]struct{}{}
	normalized := make([]any, 0, len(entries))
	for _, rawEntry := range entries {
		entry, ok := object(rawEntry)
		if !ok || !hasExactKeys(entry, "kind", "locator", "head_oid", "result", "content_sha256") {
			return nil, fail("evidence locator has unknown or missing fields")
		}
		kind, kindOK := entry["kind"].(string)
		if _, known := order[kind]; !kindOK || !known {
			return nil, fail("evidence kind is unknown")
		}
		locator, locatorOK := entry["locator"].(string)
		result, resultOK := entry["result"].(string)
		if !locatorOK || !resultOK || !isBoundedAtom(locator, 2048) || !isBoundedAtom(result, 256) {
			return nil, fail("evidence locator or result is invalid")
		}
		if entry["head_oid"] != headOID {
			return nil, fail("evidence head does not match candidate")
		}
		if entry["content_sha256"] != nil && !isSHA256(entry["content_sha256"]) {
			return nil, fail("evidence digest is invalid")
		}
		if result != "pass" && !(kind == "audit" && result == "not_required") {
			return nil, fmt.Errorf("evidence %s result is not accepted", kind)
		}
		if result == "not_required" && (!strings.HasPrefix(locator, "predicate:") || entry["content_sha256"] == nil) {
			return nil, fail("audit not_required must bind a predicate locator and digest")
		}
		key := kind + "\x00" + locator
		if _, duplicate := seen[key]; duplicate {
			return nil, fail("evidence locator is duplicated")
		}
		seen[key] = struct{}{}
		normalized = append(normalized, map[string]any{
			"kind": kind, "locator": locator, "head_oid": headOID,
			"result": result, "content_sha256": entry["content_sha256"],
		})
	}
	for _, kind := range evidenceKinds {
		found := false
		for _, rawEntry := range normalized {
			entry, _ := object(rawEntry)
			if entry["kind"] == kind {
				found = true
				break
			}
		}
		if !found {
			return nil, fmt.Errorf("evidence is missing %s", kind)
		}
	}
	sort.Slice(normalized, func(left, right int) bool {
		leftEntry, _ := object(normalized[left])
		rightEntry, _ := object(normalized[right])
		leftKind := leftEntry["kind"].(string)
		rightKind := rightEntry["kind"].(string)
		if order[leftKind] != order[rightKind] {
			return order[leftKind] < order[rightKind]
		}
		return compareUTF16(leftEntry["locator"].(string), rightEntry["locator"].(string)) < 0
	})
	return normalized, nil
}

func normalizeInput(value any) (map[string]any, error) {
	input, ok := object(value)
	if !ok || !hasExactKeys(input,
		"schema", "repository", "pull_request", "head_oid", "head_tree_oid", "base_ref", "base_oid",
		"potential_merge_commit", "queue_state", "evidence") || input["schema"] != inputSchema {
		return nil, fail("delivery input has an invalid schema or fields")
	}
	pullRequest, pullRequestOK := safePositiveInteger(input["pull_request"])
	potential, potentialOK := object(input["potential_merge_commit"])
	var potentialTree map[string]any
	if potentialOK {
		potentialTree, potentialOK = object(potential["tree"])
	}
	if !pullRequestOK || !isOID(input["head_oid"]) || !isOID(input["head_tree_oid"]) ||
		!isBaseRef(input["base_ref"]) || !isOID(input["base_oid"]) || !isBoundedAtom(input["queue_state"], 128) ||
		!potentialOK || !hasExactKeys(potential, "oid", "tree") || !isOID(potential["oid"]) ||
		!hasExactKeys(potentialTree, "oid") || !isOID(potentialTree["oid"]) || potential["oid"] == potentialTree["oid"] {
		return nil, fail("delivery identity or merge representation is invalid")
	}
	headOID := input["head_oid"].(string)
	headTreeOID := input["head_tree_oid"].(string)
	baseOID := input["base_oid"].(string)
	if commitTree(headOID) != headTreeOID {
		return nil, fail("candidate tree does not match the local head commit")
	}
	if mergeTree(baseOID, headOID) != potentialTree["oid"] {
		return nil, fail("merge tree does not match local base and head")
	}
	repository, err := normalizeRepository(input["repository"])
	if err != nil {
		return nil, err
	}
	evidence, err := normalizeEvidence(input["evidence"], headOID)
	if err != nil {
		return nil, err
	}
	return map[string]any{
		"schema": evidenceSchema, "repository": repository, "pull_request": pullRequest,
		"head_oid": headOID, "head_tree_oid": headTreeOID, "base_ref": input["base_ref"],
		"base_oid": baseOID, "merge_commit_oid": potential["oid"], "merge_tree_oid": potentialTree["oid"],
		"queue_state": input["queue_state"], "evidence": evidence,
	}, nil
}

func receiptDigest(inner []byte) string {
	digest := sha256.Sum256(inner)
	return "sha256:" + hex.EncodeToString(digest[:])
}

func createReceipt(source []byte) (map[string]any, error) {
	input, err := parseInput(source)
	if err != nil {
		return nil, err
	}
	receipt, err := normalizeInput(input)
	if err != nil {
		return nil, err
	}
	inner, err := canonicalLine(receipt)
	if err != nil {
		return nil, err
	}
	return map[string]any{
		"schema": receiptSchema, "bytes": int64(len(inner)), "sha256": receiptDigest(inner), "receipt": receipt,
	}, nil
}

func verifyReceipt(source []byte, expectedSHA256 string) (map[string]any, error) {
	if !sha256Pattern.MatchString(expectedSHA256) {
		return nil, fail("expected receipt digest is invalid")
	}
	value, err := parseCanonicalLine(source, "delivery receipt")
	if err != nil {
		return nil, err
	}
	envelope, ok := object(value)
	if !ok || !hasExactKeys(envelope, "schema", "bytes", "sha256", "receipt") || envelope["schema"] != receiptSchema {
		return nil, fail("delivery receipt envelope is invalid")
	}
	byteCount, byteCountOK := safePositiveInteger(envelope["bytes"])
	receiptValue, receiptOK := object(envelope["receipt"])
	if !byteCountOK || envelope["sha256"] != expectedSHA256 || !receiptOK {
		return nil, fail("delivery receipt envelope is invalid")
	}
	if !hasExactKeys(receiptValue,
		"schema", "repository", "pull_request", "head_oid", "head_tree_oid", "base_ref", "base_oid",
		"merge_commit_oid", "merge_tree_oid", "queue_state", "evidence") ||
		receiptValue["schema"] != evidenceSchema || !isOID(receiptValue["merge_commit_oid"]) || !isOID(receiptValue["merge_tree_oid"]) {
		return nil, fail("delivery receipt evidence is invalid")
	}
	input := map[string]any{
		"schema": inputSchema, "repository": receiptValue["repository"], "pull_request": receiptValue["pull_request"],
		"head_oid": receiptValue["head_oid"], "head_tree_oid": receiptValue["head_tree_oid"],
		"base_ref": receiptValue["base_ref"], "base_oid": receiptValue["base_oid"],
		"potential_merge_commit": map[string]any{
			"oid": receiptValue["merge_commit_oid"], "tree": map[string]any{"oid": receiptValue["merge_tree_oid"]},
		},
		"queue_state": receiptValue["queue_state"], "evidence": receiptValue["evidence"],
	}
	receipt, err := normalizeInput(input)
	if err != nil {
		return nil, err
	}
	inner, err := canonicalLine(receipt)
	if err != nil {
		return nil, err
	}
	replayed := map[string]any{
		"schema": receiptSchema, "bytes": byteCount, "sha256": envelope["sha256"], "receipt": receipt,
	}
	replayedBytes, canonicalErr := canonicalLine(replayed)
	receiptBytes, receiptErr := canonicalLine(receiptValue)
	if canonicalErr != nil || receiptErr != nil || byteCount != int64(len(inner)) ||
		envelope["sha256"] != receiptDigest(inner) || !bytes.Equal(receiptBytes, inner) || !bytes.Equal(replayedBytes, source) {
		return nil, fail("delivery receipt bytes or digest do not replay")
	}
	return replayed, nil
}

func run(arguments []string, stdin []byte) ([]byte, error) {
	var value map[string]any
	var err error
	if len(arguments) == 1 && arguments[0] == "create" {
		value, err = createReceipt(stdin)
	} else if len(arguments) == 3 && arguments[0] == "verify" && arguments[1] == "--sha256" {
		value, err = verifyReceipt(stdin, arguments[2])
	} else {
		return nil, fail("usage: delivery-receipt.go create | verify --sha256 <sha256:digest>")
	}
	if err != nil {
		return nil, err
	}
	return canonicalLine(value)
}

func main() {
	stdin, err := io.ReadAll(os.Stdin)
	if err == nil {
		var output []byte
		output, err = run(os.Args[1:], stdin)
		if err == nil {
			_, err = os.Stdout.Write(output)
		}
	}
	if err != nil {
		fmt.Fprintf(os.Stderr, "delivery-receipt: failed: %s\n", err)
		os.Exit(2)
	}
}
