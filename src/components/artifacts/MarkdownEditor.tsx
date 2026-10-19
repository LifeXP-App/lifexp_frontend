"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  isListType,
  matchShortcut,
  parseMarkdown,
  serializeBlocks,
  type Block,
  type BlockType,
} from "@/src/lib/utils/markdown";
import { BLOCK_CLASS } from "@/src/components/artifacts/MarkdownView";

interface MarkdownEditorProps {
  // Markdown to start from (read once; the editor owns the text after that).
  value: string;
  onChange: (markdown: string) => void;
}

// Block ids only need to be unique among the blocks on screen.
let blockCounter = 0;
const newId = () => `block-${blockCounter++}`;

const PLACEHOLDER: Partial<Record<BlockType, string>> = {
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  quote: "Quote",
  bullet: "List item",
  number: "List item",
};

// A block editor for markdown. Each line is its own block; typing a block
// shortcut at the start of a paragraph restyles it right away -- "# " becomes
// Heading 1, "## " / "### " headings 2 and 3, "- " a bullet, "1. " a numbered
// item, "> " a quote. Enter splits a block (lists continue, empty list items
// end the list), Backspace at the start un-styles then merges upward, the
// arrow keys move between blocks. **bold**, *italic*, `code` and links stay
// as typed here and are rendered when the writing is viewed.
export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseMarkdown(value, newId));
  const areas = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const pendingFocus = useRef<{ id: string; pos: number } | null>(null);

  const commit = (next: Block[], focus?: { id: string; pos: number }) => {
    if (focus) pendingFocus.current = focus;
    setBlocks(next);
    onChange(serializeBlocks(next));
  };

  useLayoutEffect(() => {
    const f = pendingFocus.current;
    if (!f) return;
    pendingFocus.current = null;
    const el = areas.current[f.id];
    if (el) {
      el.focus();
      el.setSelectionRange(f.pos, f.pos);
    }
  });

  const update = (index: number, patch: Partial<Block>, focus?: { id: string; pos: number }) =>
    commit(blocks.map((b, i) => (i === index ? { ...b, ...patch } : b)), focus);

  const handleChange = (index: number, raw: string) => {
    const block = blocks[index];
    const text = raw.replace(/\n/g, " ");
    if (block.type === "p") {
      const shortcut = matchShortcut(text);
      if (shortcut) {
        update(index, { type: shortcut.type, text: shortcut.rest }, { id: block.id, pos: 0 });
        return;
      }
    }
    update(index, { text });
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    const block = blocks[index];
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    if (e.key === "Enter") {
      e.preventDefault();
      // An empty list item / quote ends the list instead of adding another.
      if ((isListType(block.type) || block.type === "quote") && block.text === "") {
        update(index, { type: "p" }, { id: block.id, pos: 0 });
        return;
      }
      const keepsType = isListType(block.type) || block.type === "quote";
      const created: Block = {
        id: newId(),
        type: keepsType ? block.type : "p",
        text: block.text.slice(end),
      };
      const next = [...blocks];
      next[index] = { ...block, text: block.text.slice(0, start) };
      next.splice(index + 1, 0, created);
      commit(next, { id: created.id, pos: 0 });
    } else if (e.key === "Backspace" && start === 0 && end === 0) {
      if (block.type !== "p") {
        e.preventDefault();
        update(index, { type: "p" }, { id: block.id, pos: 0 });
      } else if (index > 0) {
        e.preventDefault();
        const prev = blocks[index - 1];
        const next = blocks.filter((_, i) => i !== index);
        next[index - 1] = { ...prev, text: prev.text + block.text };
        commit(next, { id: prev.id, pos: prev.text.length });
      }
    } else if (e.key === "ArrowUp" && start === 0 && end === 0 && index > 0) {
      e.preventDefault();
      const prev = blocks[index - 1];
      pendingFocus.current = { id: prev.id, pos: prev.text.length };
      setBlocks([...blocks]); // re-run the focus effect
    } else if (e.key === "ArrowDown" && start === block.text.length && end === start && index < blocks.length - 1) {
      e.preventDefault();
      pendingFocus.current = { id: blocks[index + 1].id, pos: 0 };
      setBlocks([...blocks]);
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (!/\r?\n/.test(pasted)) return; // single-line paste behaves normally
    e.preventDefault();
    const incoming = parseMarkdown(pasted, newId);
    const block = blocks[index];
    const next = [...blocks];
    if (block.text === "") next.splice(index, 1, ...incoming);
    else next.splice(index + 1, 0, ...incoming);
    const last = incoming[incoming.length - 1];
    commit(next, { id: last.id, pos: last.text.length });
  };

  // Position of each numbered item within its run of consecutive numbered items.
  const numbers = blocks.reduce<number[]>((acc, b, i) => {
    acc.push(b.type === "number" ? (blocks[i - 1]?.type === "number" ? acc[i - 1] + 1 : 1) : 0);
    return acc;
  }, []);

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-dark-2 border border-gray-200 dark:border-[var(--border)] focus-within:border-[var(--accent)] transition-colors px-6 py-5 min-h-[50vh] max-h-[62vh] overflow-y-auto">
      <div className="space-y-2">
        {blocks.map((block, index) => {
          const isOnlyEmpty = blocks.length === 1 && block.text === "";
          const area = (
            <textarea
              ref={(el) => {
                areas.current[block.id] = el;
                if (el) {
                  el.style.height = "auto";
                  el.style.height = `${el.scrollHeight}px`;
                }
              }}
              rows={1}
              value={block.text}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => handlePaste(index, e)}
              placeholder={
                isOnlyEmpty
                  ? "Write something... type # and a space for a heading"
                  : PLACEHOLDER[block.type]
              }
              spellCheck
              className={`min-w-0 flex-1 resize-none overflow-hidden bg-transparent outline-none text-foreground dark:text-[var(--foreground)] placeholder-gray-400 dark:placeholder-[var(--muted)] ${BLOCK_CLASS[block.type]}`}
            />
          );

          if (block.type === "quote")
            return (
              <div key={block.id} className="flex border-l-4 border-gray-300 dark:border-[var(--border)] pl-4">
                {area}
              </div>
            );
          if (isListType(block.type))
            return (
              <div key={block.id} className="flex items-start gap-2">
                <span className={`select-none text-gray-400 dark:text-[var(--muted)] ${BLOCK_CLASS[block.type]}`}>
                  {block.type === "bullet" ? "•" : `${numbers[index]}.`}
                </span>
                {area}
              </div>
            );
          return (
            <div key={block.id} className="flex">
              {area}
            </div>
          );
        })}
      </div>
    </div>
  );
}
