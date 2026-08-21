import { createHash } from "node:crypto";

function fail(label, message) {
  throw new Error(`${label}: ${message}`);
}

function messageDigest(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export function parseAgentMessagePolicy(value, label = "agent-message policy") {
  if (value === undefined) return null;
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      JSON.stringify(Object.keys(value).sort()) !== JSON.stringify(["allowed_interim_exact", "max_interim"])) {
    fail(label, "expected exact max_interim and allowed_interim_exact fields");
  }
  if (![0, 1].includes(value.max_interim) || !Array.isArray(value.allowed_interim_exact) ||
      value.allowed_interim_exact.length < value.max_interim ||
      (value.max_interim === 0 && value.allowed_interim_exact.length !== 0) ||
      new Set(value.allowed_interim_exact).size !== value.allowed_interim_exact.length) {
    fail(label, "contains an invalid interim bound or allowlist");
  }
  for (const message of value.allowed_interim_exact) {
    if (typeof message !== "string" || message.length === 0 || message.trim() !== message ||
        /[\r\n\0]/.test(message) || Buffer.byteLength(message) > 240) {
      fail(label, "allowlisted messages must be unique bounded single lines");
    }
  }
  return {
    max_interim: value.max_interim,
    allowed_interim_exact: [...value.allowed_interim_exact],
  };
}

export function verifyAgentMessageTrajectory({ messages, finalText, policy, label = "agent-message trajectory" }) {
  const admitted = parseAgentMessagePolicy(policy, `${label} policy`);
  if (admitted === null) return;
  if (!Array.isArray(messages) || messages.length === 0 ||
      messages.some((message) => typeof message !== "string") || messages.at(-1) !== finalText) {
    fail(label, "must end in the exact terminal output");
  }
  const interim = messages.slice(0, -1);
  if (interim.length > admitted.max_interim ||
      interim.some((message) => !admitted.allowed_interim_exact.includes(message))) {
    fail(label, "contains an unadmitted interim message");
  }
}

export function verifyAgentMessageDigestTrajectory({
  messageDigests,
  finalDigest,
  policy,
  label = "agent-message digest trajectory",
}) {
  const admitted = parseAgentMessagePolicy(policy, `${label} policy`);
  if (admitted === null) return;
  if (!Array.isArray(messageDigests) || messageDigests.length === 0 ||
      messageDigests.some((digest) => !/^sha256:[a-f0-9]{64}$/.test(digest)) ||
      messageDigests.at(-1) !== finalDigest) {
    fail(label, "must end in the exact terminal digest");
  }
  const allowed = new Set(admitted.allowed_interim_exact.map(messageDigest));
  const interim = messageDigests.slice(0, -1);
  if (interim.length > admitted.max_interim || interim.some((digest) => !allowed.has(digest))) {
    fail(label, "contains an unadmitted interim message digest");
  }
}
