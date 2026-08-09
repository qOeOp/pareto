package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"os/exec"
	"path/filepath"
	"runtime"
	"testing"
)

func gitTestOutput(t *testing.T, arguments ...string) string {
	t.Helper()
	output, err := exec.Command("git", arguments...).Output()
	if err != nil {
		t.Fatalf("git %v: %v", arguments, err)
	}
	return string(bytes.TrimSpace(output))
}

func validInput(t *testing.T) []byte {
	t.Helper()
	head := gitTestOutput(t, "rev-parse", "HEAD")
	base := gitTestOutput(t, "rev-parse", "HEAD^")
	headTree := gitTestOutput(t, "rev-parse", "HEAD^{tree}")
	mergeTree := gitTestOutput(t, "merge-tree", "--write-tree", base, head)
	evidence := make([]any, 0, len(evidenceKinds))
	for _, kind := range evidenceKinds {
		entry := map[string]any{
			"kind": kind, "locator": "fixture:<>&/" + kind, "head_oid": head,
			"result": "pass", "content_sha256": nil,
		}
		if kind == "audit" {
			entry["locator"] = "predicate:audit-not-required"
			entry["result"] = "not_required"
			entry["content_sha256"] = "sha256:" + string(bytes.Repeat([]byte{'a'}, 64))
		}
		evidence = append(evidence, entry)
	}
	input := map[string]any{
		"schema": inputSchema, "repository": "QOeOp/Trade", "pull_request": 1,
		"head_oid": head, "head_tree_oid": headTree, "base_ref": "main", "base_oid": base,
		"potential_merge_commit": map[string]any{"oid": head, "tree": map[string]any{"oid": mergeTree}},
		"queue_state":            "none", "evidence": evidence,
	}
	encoded, err := json.Marshal(input)
	if err != nil {
		t.Fatal(err)
	}
	return encoded
}

func TestCreateVerifyRoundTrip(t *testing.T) {
	input := validInput(t)
	input = bytes.Replace(input, []byte(`"pull_request":1`), []byte(`"pull_request":1e3`), 1)
	receipt, err := run([]string{"create"}, input)
	if err != nil {
		t.Fatal(err)
	}
	value, err := parseCanonicalLine(receipt, "delivery receipt")
	if err != nil {
		t.Fatal(err)
	}
	envelope, _ := object(value)
	verified, err := run([]string{"verify", "--sha256", envelope["sha256"].(string)}, receipt)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(receipt, verified) {
		t.Fatal("verified receipt is not byte-identical")
	}
	if bytes.Contains(receipt, []byte(`\u003c`)) || bytes.Contains(receipt, []byte(`\u003e`)) || bytes.Contains(receipt, []byte(`\u0026`)) {
		t.Fatal("canonical JSON unexpectedly escaped HTML characters")
	}
}

func TestCanonicalOrderingMatchesJavaScriptUTF16(t *testing.T) {
	encoded, err := canonicalLine(map[string]any{"\ue000": int64(1), "\U00010000": int64(2)})
	if err != nil {
		t.Fatal(err)
	}
	if want := "{\"\U00010000\":2,\"\ue000\":1}\n"; string(encoded) != want {
		t.Fatalf("canonical key order = %q, want %q", encoded, want)
	}

	value, err := decodeJSON(validInput(t))
	if err != nil {
		t.Fatal(err)
	}
	input, _ := object(value)
	entries := input["evidence"].([]any)
	for _, rawEntry := range entries {
		entry, _ := object(rawEntry)
		if entry["kind"] == "real_consumer" {
			entry["locator"] = "fixture:\U00010000"
		}
	}
	head := input["head_oid"].(string)
	input["evidence"] = append(entries, map[string]any{
		"kind": "real_consumer", "locator": "fixture:\ue000", "head_oid": head,
		"result": "pass", "content_sha256": nil,
	})
	inputBytes, err := json.Marshal(input)
	if err != nil {
		t.Fatal(err)
	}
	receipt, err := createReceipt(inputBytes)
	if err != nil {
		t.Fatal(err)
	}
	receiptValue, _ := object(receipt["receipt"])
	normalized := receiptValue["evidence"].([]any)
	var locators []string
	for _, rawEntry := range normalized {
		entry, _ := object(rawEntry)
		if entry["kind"] == "real_consumer" {
			locators = append(locators, entry["locator"].(string))
		}
	}
	if want := []string{"fixture:\U00010000", "fixture:\ue000"}; !bytes.Equal(
		[]byte(locators[0]+"\x00"+locators[1]), []byte(want[0]+"\x00"+want[1]),
	) {
		t.Fatalf("locator order = %q, want %q", locators, want)
	}
}

func TestRejectsMalformedInput(t *testing.T) {
	cases := map[string][]byte{
		"empty":             nil,
		"duplicate":         []byte(`{"schema":"delivery-barrier-input/v3","schema":"delivery-barrier-input/v3"}`),
		"escaped duplicate": []byte(`{"schema":"delivery-barrier-input/v3","sch\u0065ma":"delivery-barrier-input/v3"}`),
		"bom":               append([]byte{0xef, 0xbb, 0xbf}, validInput(t)...),
		"invalid utf8":      {0xff},
		"lone surrogate":    []byte(`{"value":"\ud800"}`),
		"trailing content":  append(validInput(t), []byte(` true`)...),
	}
	for name, input := range cases {
		t.Run(name, func(t *testing.T) {
			if _, err := run([]string{"create"}, input); err == nil {
				t.Fatal("malformed input was accepted")
			}
		})
	}
}

func TestVerifyRejectsNonCanonicalBytes(t *testing.T) {
	receipt, err := run([]string{"create"}, validInput(t))
	if err != nil {
		t.Fatal(err)
	}
	value, _ := parseCanonicalLine(receipt, "delivery receipt")
	envelope, _ := object(value)
	digest := envelope["sha256"].(string)
	for name, input := range map[string][]byte{
		"prefix": append([]byte{' '}, receipt...),
		"suffix": append(append([]byte{}, receipt...), ' '),
		"crlf":   bytes.ReplaceAll(receipt, []byte{'\n'}, []byte{'\r', '\n'}),
	} {
		t.Run(name, func(t *testing.T) {
			if _, err := run([]string{"verify", "--sha256", digest}, input); err == nil {
				t.Fatal("non-canonical receipt was accepted")
			}
		})
	}
}

func TestCLIRejectsWithExitTwo(t *testing.T) {
	binaryName := "delivery-receipt"
	if runtime.GOOS == "windows" {
		binaryName += ".exe"
	}
	binary := filepath.Join(t.TempDir(), binaryName)
	_, testFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("test source path is unavailable")
	}
	build := exec.Command("go", "build", "-o", binary, filepath.Join(filepath.Dir(testFile), "delivery-receipt.go"))
	if output, err := build.CombinedOutput(); err != nil {
		t.Fatalf("build CLI: %v\n%s", err, output)
	}
	command := exec.Command(binary, "create")
	command.Stdin = bytes.NewBufferString(`{"schema":"delivery-barrier-input/v3","schema":"delivery-barrier-input/v3"}`)
	err := command.Run()
	var exitError *exec.ExitError
	if !errors.As(err, &exitError) || exitError.ExitCode() != 2 {
		t.Fatalf("invalid CLI input exit = %v, want 2", err)
	}
}
