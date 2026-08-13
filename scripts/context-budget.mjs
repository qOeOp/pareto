import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";

export const contextBudget = Object.freeze({
  descriptionWords: 100,
  observerWords: 2700,
  observerBytes: 22000,
});

const observerEntry = "references/quality-assurance/quality-assurance-lifecycle-policy.md";

function fail(message) {
  throw new Error(message);
}

function wordCount(source) {
  return source.trim().split(/\s+/u).filter(Boolean).length;
}

async function readReferenceClosure(skillRoot, entry) {
  const lexicalRoot = path.resolve(skillRoot);
  const resolvedRoot = await realpath(lexicalRoot);
  const pending = [path.resolve(lexicalRoot, entry)];
  const sources = new Map();
  while (pending.length > 0) {
    const file = pending.pop();
    if (sources.has(file)) continue;
    if (!file.startsWith(`${lexicalRoot}${path.sep}`)) {
      fail(`observer context link escapes skill root: ${file}`);
    }
    let entryStat;
    try {
      entryStat = await lstat(file);
    } catch {
      fail(`observer context reference is unavailable: ${path.relative(lexicalRoot, file)}`);
    }
    if (!entryStat.isFile() || entryStat.isSymbolicLink()) {
      fail(`observer context reference must be a regular non-symlink file: ${path.relative(lexicalRoot, file)}`);
    }
    const resolvedFile = await realpath(file);
    const expectedFile = path.resolve(resolvedRoot, path.relative(lexicalRoot, file));
    if (resolvedFile !== expectedFile || !resolvedFile.startsWith(`${resolvedRoot}${path.sep}`)) {
      fail(`observer context reference resolves outside its lexical Skill path: ${path.relative(lexicalRoot, file)}`);
    }
    const source = await readFile(file, "utf8");
    sources.set(file, source);
    for (const match of source.matchAll(/\]\(([^)]+)\)/g)) {
      const link = match[1];
      if (/^(?:https?:|mailto:|#)/.test(link)) continue;
      const relative = decodeURIComponent(link.split("#", 1)[0]);
      if (relative.length > 0) pending.push(path.resolve(path.dirname(file), relative));
    }
  }
  return sources;
}

export async function measureContextBudget(skillRoot) {
  const skillFile = path.resolve(skillRoot, "SKILL.md");
  const skillSource = await readFile(skillFile, "utf8");
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(skillSource)?.[1];
  if (!frontmatter) fail("Skill frontmatter is unavailable");
  let metadata;
  try {
    metadata = parseYaml(frontmatter);
  } catch {
    fail("Skill frontmatter is invalid");
  }
  const description = metadata?.description;
  if (typeof description !== "string" || description.trim().length === 0) {
    fail("Skill description is unavailable");
  }
  const observerSources = await readReferenceClosure(skillRoot, observerEntry);
  observerSources.set(skillFile, skillSource);
  const observerContext = [...observerSources.values()].join("\n");
  return {
    descriptionWords: wordCount(description),
    observerWords: wordCount(observerContext),
    observerBytes: Buffer.byteLength(observerContext),
  };
}

export async function assertContextBudget(skillRoot) {
  const measured = await measureContextBudget(skillRoot);
  if (measured.descriptionWords > contextBudget.descriptionWords) {
    fail(`Skill description exceeds ${contextBudget.descriptionWords} words`);
  }
  if (measured.observerWords > contextBudget.observerWords) {
    fail(`observer sentinel context exceeds ${contextBudget.observerWords} words`);
  }
  if (measured.observerBytes > contextBudget.observerBytes) {
    fail(`observer sentinel context exceeds ${contextBudget.observerBytes} bytes`);
  }
  return measured;
}
