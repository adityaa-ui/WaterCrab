"use client";
import React from "react";

const JSON_TOKEN =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

/** Lightweight JSON syntax highlighting — keys, strings, numbers, literals. */
function tokenize(json: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let cursor = 0;
  let idx = 0;
  const re = new RegExp(JSON_TOKEN.source, "g");
  let m: RegExpExecArray | null;

  while ((m = re.exec(json)) !== null) {
    if (m.index > cursor) {
      out.push(
        <React.Fragment key={`${keyBase}-p${idx++}`}>
          {json.slice(cursor, m.index)}
        </React.Fragment>
      );
    }
    const token = m[0];
    let className = "text-[var(--color-foreground)]";
    if (token.startsWith('"')) {
      className = /\S+\s*:$/.test(token)
        ? "text-[var(--color-accent)]"
        : "text-[var(--color-success)]";
    } else if (token === "true" || token === "false") {
      className = "text-[var(--color-warning)]";
    } else if (token === "null") {
      className = "text-[var(--color-foreground-muted)]";
    } else {
      className = "text-[var(--color-tide-teal)]";
    }
    out.push(
      <span key={`${keyBase}-k${idx++}`} className={className}>
        {token}
      </span>
    );
    cursor = m.index + token.length;
  }

  if (cursor < json.length) {
    out.push(
      <React.Fragment key={`${keyBase}-p${idx}`}>{json.slice(cursor)}</React.Fragment>
    );
  }
  return out;
}

export interface ResultJsonProps {
  jsonText: string;
}

/** Structured JSON document view with syntax highlighting and validation. */
export default function ResultJson({ jsonText }: ResultJsonProps) {
  let valid = true;
  try {
    JSON.parse(jsonText);
  } catch {
    valid = false;
  }
  const hasContent = jsonText.trim().length > 0;
  const sizeKb = (jsonText.length / 1024).toFixed(1);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]/60 px-4 py-1.5 md:px-5">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-foreground-muted)]">
          application/json · {sizeKb} KB
        </span>
        <span
          className={`flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
            valid ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              valid ? "bg-[var(--color-success)]" : "bg-[var(--color-danger)]"
            }`}
          />
          {valid ? "Valid JSON" : "Malformed JSON"}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-[var(--color-paper-white)]/50">
        {hasContent ? (
          <pre className="whitespace-pre p-5 font-mono text-xs leading-[1.7] selection:bg-[rgba(97,95,255,0.18)]">
            {tokenize(jsonText, "json")}
          </pre>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <p className="text-sm text-[var(--color-foreground-secondary)]">
              No structured data was returned for this page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
