"use client";
import React from "react";
import { downloadText } from "@/lib/download";
import { CheckIcon, CopyIcon, DownloadIcon } from "@/lib/icons";

export interface ExtractResultProps {
  data: Record<string, unknown>;
  onCopy: (text: string) => void;
  copied: boolean;
}

export default function ExtractResult({ data, onCopy, copied }: ExtractResultProps) {
  const json = JSON.stringify(data, null, 2);

  return (
    <div className="animate-fadeIn flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-[18px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] shadow-[0_16px_40px_rgba(41,37,36,0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="shrink-0 rounded bg-[var(--color-lichen-green)]/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-lichen-green)]">
            JSON
          </span>
          <span className="font-mono text-xs font-semibold text-[var(--color-charcoal)]">Extraction Output</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCopy(json)}
            title="Copy JSON"
            className="rounded-lg border border-[var(--color-stone-mist)] p-1.5 text-[var(--color-bark-grey)] transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-charcoal)]"
          >
            {copied ? <CheckIcon className="text-[var(--color-lichen-green)]" /> : <CopyIcon />}
          </button>
          <button
            type="button"
            onClick={() => downloadText("extraction.json", json, "application/json;charset=utf-8")}
            title="Download JSON"
            className="rounded-lg border border-[var(--color-stone-mist)] p-1.5 text-[var(--color-bark-grey)] transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-charcoal)]"
          >
            <DownloadIcon />
          </button>
        </div>
      </div>

      <div className="max-h-[520px] flex-1 overflow-auto bg-[var(--color-warm-bone)] p-5">
        <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-[var(--color-charcoal)] selection:bg-[rgba(97,95,255,0.18)]">
          {json}
        </pre>
      </div>
    </div>
  );
}
