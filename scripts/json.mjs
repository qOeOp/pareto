export function rejectDuplicateJsonObjectMembers(source, label) {
  let index = 0;

  function fail(message) {
    throw new Error(message);
  }

  function skipWhitespace() {
    while (/\s/.test(source[index] ?? "")) index += 1;
  }

  function readString() {
    const start = index;
    if (source[index] !== '"') fail(`${label}: expected a JSON string at byte ${index}`);
    index += 1;
    while (index < source.length) {
      if (source[index] === "\\") {
        index += 2;
        continue;
      }
      if (source[index] === '"') {
        index += 1;
        try {
          return JSON.parse(source.slice(start, index));
        } catch {
          fail(`${label}: invalid JSON string at byte ${start}`);
        }
      }
      index += 1;
    }
    fail(`${label}: unterminated JSON string at byte ${start}`);
  }

  function readValue() {
    skipWhitespace();
    if (source[index] === "{") return readObject();
    if (source[index] === "[") return readArray();
    if (source[index] === '"') {
      readString();
      return;
    }
    const start = index;
    while (index < source.length && !/[\s,\]}]/.test(source[index])) index += 1;
    if (index === start) fail(`${label}: expected a JSON value at byte ${index}`);
  }

  function readObject() {
    index += 1;
    const members = new Set();
    skipWhitespace();
    if (source[index] === "}") {
      index += 1;
      return;
    }
    while (index < source.length) {
      skipWhitespace();
      const member = readString();
      if (members.has(member)) fail(`${label}: duplicate JSON object member ${member}`);
      members.add(member);
      skipWhitespace();
      if (source[index] !== ":") fail(`${label}: expected : after object member ${member}`);
      index += 1;
      readValue();
      skipWhitespace();
      if (source[index] === "}") {
        index += 1;
        return;
      }
      if (source[index] !== ",") fail(`${label}: expected , after object member ${member}`);
      index += 1;
    }
    fail(`${label}: unterminated JSON object`);
  }

  function readArray() {
    index += 1;
    skipWhitespace();
    if (source[index] === "]") {
      index += 1;
      return;
    }
    while (index < source.length) {
      readValue();
      skipWhitespace();
      if (source[index] === "]") {
        index += 1;
        return;
      }
      if (source[index] !== ",") fail(`${label}: expected , in JSON array`);
      index += 1;
    }
    fail(`${label}: unterminated JSON array`);
  }

  readValue();
}
