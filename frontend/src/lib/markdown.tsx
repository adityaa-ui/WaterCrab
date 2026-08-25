import React from "react";

/**
 * Minimal, safe Markdown → React renderer used for the scrape result preview.
 *
 * Deliberately small: it renders the most common block and inline constructs
 * and never uses `dangerouslySetInnerHTML`, so scraped page content stays
 * inert. Links are sanitized to http(s)/mailto/relative targets only.
 */

type Block =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: "paragraph"; text: string }
  | { type: "code"; lang: string; code: string }
  | { type: "quote"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "hr" };

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code blocks (``` or ~~~).
    const fence = line.match(/^\s*(```|~~~)(.*)$/);
    if (fence) {
      const lang = fence[2].trim();
      const code: string[] = [];
      i += 1;
      let closed = false;
      while (i < lines.length) {
        if (/^\s*(```|~~~)/.test(lines[i])) {
          closed = true;
          i += 1;
          break;
        }
        code.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: "code", lang, code: code.join("\n") });
      if (!closed) break;
      continue;
    }

    // ATX headings.
    const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        text: heading[2].trim()
      });
      i += 1;
      continue;
    }

    // Horizontal rules (---, ***, ___).
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    // Blockquotes — consecutive `>` lines are grouped into one quote block.
    if (/^\s*>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "quote", text: quote.join("\n") });
      continue;
    }

    // Lists — consecutive markers are grouped into one list block.
    const ulMatch = line.match(/^\s*[-+*]\s+(.*)$/);
    const olMatch = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ulMatch || olMatch) {
      const ordered = Boolean(olMatch);
      const items: string[] = [];
      while (i < lines.length) {
        const m = ordered
          ? lines[i].match(/^\s*\d+[.)]\s+(.*)$/)
          : lines[i].match(/^\s*[-+*]\s+(.*)$/);
        if (m) {
          items.push(m[1]);
          i += 1;
        } else {
          break;
        }
      }
      blocks.push({ type: ordered ? "ol" : "ul", items });
      continue;
    }

    // Blank line.
    if (/^\s*$/.test(line)) {
      i += 1;
      continue;
    }

    // Paragraph — group until a blank line or the next block opener.
    const para: string[] = [];
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^\s*(#{1,6}\s|```|~~~|>\s?|[-+*]\s|\d+[.)]\s|-{3,}\s*$)/.test(lines[i])
    ) {
      para.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "paragraph", text: para.join(" ") });
  }

  return blocks;
}

/** Inline tokens: code, links, bold, italic (bold is matched first). */
const INLINE_TOKEN =
  /(`[^`]+`|\[[^\]\n]+\]\([^)\s]+\)|\*\*[^*\n]+\*\*|__[^\n]+__|\*[^*\n]+\*|_[^\n_]+_)/g;

function renderLink(label: string, href: string, key: string): React.ReactNode {
  const trimmed = href.trim();
  const safe =
    /^(https?:|mailto:)/i.test(trimmed) ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("#")
      ? trimmed
      : null;
  if (!safe) {
    return <span key={key}>{label}</span>;
  }
  const external = safe.startsWith("http");
  return (
    <a
      key={key}
      href={safe}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="font-medium text-[var(--color-sapphire-link)] underline decoration-[var(--color-sapphire-link)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-sapphire-link)]"
    >
      {label}
    </a>
  );
}

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let cursor = 0;
  let idx = 0;
  const re = new RegExp(INLINE_TOKEN.source, "g");
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > cursor) {
      out.push(
        <React.Fragment key={`${keyBase}-t${idx++}`}>
          {text.slice(cursor, match.index)}
        </React.Fragment>
      );
    }
    const token = match[0];

    if (token.startsWith("`")) {
      out.push(
        <code
          key={`${keyBase}-c${idx++}`}
          className="rounded bg-[rgba(97,95,255,0.09)] px-1 py-0.5 font-mono text-[0.86em] text-[var(--color-charcoal)]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("[")) {
      const link = token.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      if (link) {
        out.push(renderLink(link[1], link[2], `${keyBase}-l${idx++}`));
      } else {
        out.push(
          <React.Fragment key={`${keyBase}-t${idx++}`}>{token}</React.Fragment>
        );
      }
    } else if (token.startsWith("**") || token.startsWith("__")) {
      out.push(
        <strong key={`${keyBase}-s${idx++}`} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") || token.startsWith("_")) {
      out.push(<em key={`${keyBase}-e${idx++}`}>{token.slice(1, -1)}</em>);
    } else {
      out.push(
        <React.Fragment key={`${keyBase}-t${idx++}`}>{token}</React.Fragment>
      );
    }
    cursor = match.index + token.length;
  }

  if (cursor < text.length) {
    out.push(
      <React.Fragment key={`${keyBase}-t${idx}`}>{text.slice(cursor)}</React.Fragment>
    );
  }
  return out;
}

const headingClasses: Record<number, string> = {
  1: "mt-7 mb-3 text-2xl font-semibold tracking-[-0.01em] text-[var(--color-charcoal)]",
  2: "mt-6 mb-2.5 text-xl font-semibold tracking-[-0.01em] text-[var(--color-charcoal)]",
  3: "mt-5 mb-2 text-lg font-semibold text-[var(--color-charcoal)]",
  4: "mt-4 mb-1.5 text-base font-semibold text-[var(--color-charcoal)]",
  5: "mt-4 mb-1.5 text-sm font-semibold uppercase tracking-wider text-[var(--color-charcoal)]",
  6: "mt-3 mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-bark-grey)]"
};

function renderBlocks(blocks: Block[]): React.ReactNode[] {
  return blocks.map((block, i) => {
    switch (block.type) {
      case "heading": {
        const Tag = `h${block.level}` as React.ElementType;
        return (
          <Tag key={i} className={headingClasses[block.level]}>
            {renderInline(block.text, `h${i}`)}
          </Tag>
        );
      }
      case "paragraph":
        return (
          <p
            key={i}
            className="my-3 text-[14px] leading-[1.75] text-[var(--color-charcoal)]"
          >
            {renderInline(block.text, `p${i}`)}
          </p>
        );
      case "quote":
        return (
          <blockquote
            key={i}
            className="my-4 border-l-2 border-[var(--color-accent)] pl-4 text-[14px] italic leading-relaxed text-[var(--color-foreground-secondary)]"
          >
            {renderInline(block.text, `q${i}`)}
          </blockquote>
        );
      case "code":
        return (
          <div
            key={i}
            className="my-4 overflow-hidden rounded-lg border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)]"
          >
            {block.lang && (
              <div className="border-b border-[var(--color-stone-mist)] px-3 py-1">
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--color-pebble)]">
                  {block.lang}
                </span>
              </div>
            )}
            <pre className="overflow-x-auto p-3 font-mono text-[11px] leading-relaxed text-[var(--color-charcoal)]">
              <code>{block.code}</code>
            </pre>
          </div>
        );
      case "ul":
        return (
          <ul
            key={i}
            className="my-3 list-disc space-y-1 pl-5 text-[14px] leading-[1.7] text-[var(--color-charcoal)] marker:text-[var(--color-electric-indigo)]"
          >
            {block.items.map((item, j) => (
              <li key={j}>{renderInline(item, `u${i}-${j}`)}</li>
            ))}
          </ul>
        );
      case "ol":
        return (
          <ol
            key={i}
            className="my-3 list-decimal space-y-1 pl-5 text-[14px] leading-[1.7] text-[var(--color-charcoal)] marker:text-[var(--color-electric-indigo)]"
          >
            {block.items.map((item, j) => (
              <li key={j}>{renderInline(item, `o${i}-${j}`)}</li>
            ))}
          </ol>
        );
      case "hr":
        return <hr key={i} className="my-6 border-[var(--color-stone-mist)]" />;
      default:
        return null;
    }
  });
}

/** Renders Markdown to React elements; returns null when there is no content. */
export function renderMarkdown(markdown: string): React.ReactNode {
  const blocks = parseBlocks(markdown);
  if (blocks.length === 0) return null;
  return <>{renderBlocks(blocks)}</>;
}


