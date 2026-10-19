import React from "react";
import { isListType, parseMarkdown, type Block } from "@/src/lib/utils/markdown";

// **bold**, *italic*, `code` and [text](https://link) -- rendered as React
// nodes (no HTML injection), anything else is plain text.
const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;

export function renderInline(text: string): React.ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
      return (
        <code key={i} className="rounded bg-black/10 dark:bg-white/10 px-1 py-0.5 text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link)
      return (
        <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          {link[1]}
        </a>
      );
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export const BLOCK_CLASS: Record<Block["type"], string> = {
  p: "text-base leading-relaxed",
  h1: "text-3xl font-bold leading-tight",
  h2: "text-2xl font-bold leading-tight",
  h3: "text-xl font-semibold leading-snug",
  quote: "text-base leading-relaxed italic text-gray-600 dark:text-[var(--muted)]",
  bullet: "text-base leading-relaxed",
  number: "text-base leading-relaxed",
};

// Read-only rendering of a Writing artifact's markdown.
export default function MarkdownView({ markdown }: { markdown: string }) {
  let id = 0;
  const blocks = parseMarkdown(markdown, () => String(id++));
  const numbers = blocks.reduce<number[]>((acc, b, i) => {
    acc.push(b.type === "number" ? (blocks[i - 1]?.type === "number" ? acc[i - 1] + 1 : 1) : 0);
    return acc;
  }, []);

  return (
    <div className="space-y-3 text-foreground dark:text-[var(--foreground)] break-words">
      {blocks.map((b, i) => {
        const content = renderInline(b.text);
        if (b.type === "quote")
          return (
            <blockquote key={b.id} className={`border-l-4 border-gray-300 dark:border-[var(--border)] pl-4 ${BLOCK_CLASS.quote}`}>
              {content}
            </blockquote>
          );
        if (isListType(b.type))
          return (
            <div key={b.id} className={`flex gap-2 ${BLOCK_CLASS[b.type]}`}>
              <span className="select-none text-gray-400 dark:text-[var(--muted)]">
                {b.type === "bullet" ? "•" : `${numbers[i]}.`}
              </span>
              <span className="min-w-0">{content}</span>
            </div>
          );
        const Tag = b.type === "p" ? "p" : (b.type as "h1" | "h2" | "h3");
        return (
          <Tag key={b.id} className={BLOCK_CLASS[b.type]}>
            {content}
          </Tag>
        );
      })}
    </div>
  );
}
