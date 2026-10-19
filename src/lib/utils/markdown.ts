// Tiny markdown model for the Writing artifacts: a document is a list of
// blocks, one per line. Stored/transmitted as ordinary markdown text.

export type BlockType = "p" | "h1" | "h2" | "h3" | "quote" | "bullet" | "number";

export interface Block {
  id: string;
  type: BlockType;
  text: string;
}

export const isListType = (t: BlockType) => t === "bullet" || t === "number";

// Block shortcut typed at the start of a paragraph: "# ", "## ", "### ",
// "- " / "* " / "+ ", "1. " and "> ".
const SHORTCUTS: { re: RegExp; type: BlockType }[] = [
  { re: /^###\s/, type: "h3" },
  { re: /^##\s/, type: "h2" },
  { re: /^#\s/, type: "h1" },
  { re: /^[-*+]\s/, type: "bullet" },
  { re: /^\d+[.)]\s/, type: "number" },
  { re: /^>\s/, type: "quote" },
];

export function matchShortcut(text: string): { type: BlockType; rest: string } | null {
  for (const { re, type } of SHORTCUTS) {
    const m = text.match(re);
    if (m) return { type, rest: text.slice(m[0].length) };
  }
  return null;
}

export function parseMarkdown(md: string, newId: () => string): Block[] {
  const blocks: Block[] = [];
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
      const level = Math.min(m[1].length, 3);
      blocks.push({ id: newId(), type: `h${level}` as BlockType, text: m[2] });
    } else if ((m = line.match(/^\s*[-*+]\s+(.*)$/))) {
      blocks.push({ id: newId(), type: "bullet", text: m[1] });
    } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      blocks.push({ id: newId(), type: "number", text: m[1] });
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      blocks.push({ id: newId(), type: "quote", text: m[1] });
    } else {
      blocks.push({ id: newId(), type: "p", text: line });
    }
  }
  return blocks.length ? blocks : [{ id: newId(), type: "p", text: "" }];
}

const PREFIX: Record<BlockType, string> = {
  p: "",
  h1: "# ",
  h2: "## ",
  h3: "### ",
  quote: "> ",
  bullet: "- ",
  number: "1. ",
};

export function serializeBlocks(blocks: Block[]): string {
  const kept = blocks.filter((b) => b.text.trim().length > 0);
  let out = "";
  kept.forEach((b, i) => {
    const prev = kept[i - 1];
    const line = `${PREFIX[b.type]}${b.text}`;
    if (i === 0) out = line;
    else out += (prev && prev.type === b.type && isListType(b.type) ? "\n" : "\n\n") + line;
  });
  return out;
}

// Plain-text version for card previews (markers removed).
export function markdownToPlain(md: string): string {
  return md
    .split(/\r?\n/)
    .map((l) =>
      l
        .replace(/^\s*(#{1,6}|[-*+]|\d+[.)]|>)\s+/, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1"),
    )
    .filter((l) => l.trim())
    .join(" ");
}
