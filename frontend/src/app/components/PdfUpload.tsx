"use client";
import React, { useCallback, useRef, useState } from "react";
import { CheckIcon, CopyIcon, DownloadIcon, UploadIcon, DocumentIcon } from "@/lib/icons";
import { downloadText } from "@/lib/download";

interface PdfUploadProps {
  bare?: boolean;
}

type ParseState = "idle" | "uploading" | "done" | "error";

interface ParsedFile {
  name: string;
  sizeKb: number;
  text: string;
  wordCount: number;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfUpload({ bare = false }: PdfUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<ParseState>("idle");
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const reset = () => {
    setFile(null);
    setState("idle");
    setParsed(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = useCallback(async (selected: File | null | undefined) => {
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      setError("Please select a PDF file (.pdf).");
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      setError("File is too large. Maximum allowed size is 20 MB.");
      return;
    }
    setFile(selected);
    setState("uploading");
    setError("");
    setParsed(null);

    try {
      // Use browser-native PDF text extraction via FormData + fetch to /api/parse-pdf
      // If no backend endpoint is available, fall back to extracting text via FileReader
      const formData = new FormData();
      formData.append("file", selected);

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://watercrab-1.onrender.com";
      let text = "";

      try {
        const res = await fetch(`${backendUrl}/parse-pdf`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          text = data.text || "";
        } else {
          throw new Error("Backend parse-pdf not available");
        }
      } catch {
        // Graceful fallback: read as ArrayBuffer and extract readable chars
        const buffer = await selected.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const rawText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
        // Extract readable text chunks (skip binary PDF metadata)
        const chunks = rawText.match(/[\x20-\x7E\n\r\t]{4,}/g) ?? [];
        text = chunks
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (!text) text = "[No readable text could be extracted from this PDF. The file may be image-based or encrypted.]";
      }

      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
      setParsed({
        name: selected.name,
        sizeKb: Math.round(selected.size / 1024),
        text,
        wordCount
      });
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process the PDF.");
      setState("error");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      void handleFile(dropped);
    },
    [handleFile]
  );

  const copy = () => {
    if (!parsed) return;
    navigator.clipboard.writeText(parsed.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const download = () => {
    if (!parsed) return;
    const stem = parsed.name.replace(/\.pdf$/i, "");
    downloadText(`${stem}.txt`, parsed.text, "text/plain;charset=utf-8");
  };

  const dropzone = (
    <div
      role="button"
      tabIndex={0}
      aria-label="PDF upload dropzone"
      onClick={() => state === "idle" && inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && state === "idle" && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative flex min-h-56 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition select-none ${
        isDragging
          ? "border-[var(--color-electric-indigo)] bg-[rgba(142,111,75,0.06)]"
          : state === "done"
          ? "border-[var(--color-success)] bg-[rgba(94,165,0,0.04)] cursor-default"
          : state === "uploading"
          ? "border-[var(--color-electric-indigo)] bg-[rgba(142,111,75,0.04)] cursor-wait"
          : "border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] hover:border-[var(--color-electric-indigo)]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {state === "uploading" && (
        <>
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-electric-indigo)] border-t-transparent" />
          <span className="mt-4 font-semibold text-[var(--color-charcoal)]">Parsing PDF…</span>
          <span className="mt-1 text-sm text-[var(--color-bark-grey)]">{file?.name}</span>
        </>
      )}

      {state === "idle" && (
        <>
          <UploadIcon className="h-9 w-9 text-[var(--color-electric-indigo)]" />
          <span className="mt-4 font-semibold text-[var(--color-charcoal)]">
            Choose a PDF or drag it here
          </span>
          <span className="mt-1 text-sm text-[var(--color-bark-grey)]">PDF files only · Max 20 MB</span>
        </>
      )}

      {state === "done" && parsed && (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(94,165,0,0.12)]">
            <DocumentIcon className="h-6 w-6 text-[var(--color-success)]" />
          </div>
          <span className="mt-3 font-semibold text-[var(--color-charcoal)]">{parsed.name}</span>
          <span className="mt-1 text-sm text-[var(--color-bark-grey)]">
            {parsed.sizeKb} KB · {parsed.wordCount.toLocaleString()} words extracted
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); reset(); }}
            className="mt-4 rounded-lg border border-[var(--color-stone-mist)] px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-bark-grey)] hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-charcoal)]"
          >
            Upload another
          </button>
        </>
      )}

      {state === "error" && (
        <>
          <span className="text-3xl">⚠</span>
          <span className="mt-3 font-semibold text-[var(--color-danger)]">Upload failed</span>
          <span className="mt-1 max-w-sm text-sm text-[var(--color-bark-grey)]">{error}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); reset(); }}
            className="mt-4 rounded-lg border border-[var(--color-stone-mist)] px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-bark-grey)] hover:border-[var(--color-danger)]"
          >
            Try again
          </button>
        </>
      )}
    </div>
  );

  const resultPanel = parsed && state === "done" && (
    <div className="animate-fadeIn mt-6 overflow-hidden rounded-2xl border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] shadow-[0_8px_32px_rgba(41,37,36,0.08)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-[rgba(94,165,0,0.28)] bg-[rgba(94,165,0,0.08)] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-success)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
            Parsed
          </span>
          <span className="max-w-xs truncate font-mono text-[11px] font-semibold text-[var(--color-charcoal)]">
            {parsed.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copy}
            title="Copy text"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-stone-mist)] text-[var(--color-bark-grey)] transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-charcoal)]"
          >
            {copied ? <CheckIcon className="h-3.5 w-3.5 text-[var(--color-success)]" /> : <CopyIcon className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={download}
            title="Download as .txt"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-stone-mist)] text-[var(--color-bark-grey)] transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-charcoal)]"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-6 border-b border-[var(--color-stone-mist)] px-5 py-3">
        <div>
          <div className="font-mono text-[9px] font-semibold uppercase tracking-widest text-[var(--color-pebble)]">Words</div>
          <div className="mt-0.5 font-mono text-sm font-bold text-[var(--color-charcoal)]">
            {parsed.wordCount.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="font-mono text-[9px] font-semibold uppercase tracking-widest text-[var(--color-pebble)]">Size</div>
          <div className="mt-0.5 font-mono text-sm font-bold text-[var(--color-charcoal)]">{parsed.sizeKb} KB</div>
        </div>
        <div>
          <div className="font-mono text-[9px] font-semibold uppercase tracking-widest text-[var(--color-pebble)]">Characters</div>
          <div className="mt-0.5 font-mono text-sm font-bold text-[var(--color-charcoal)]">
            {parsed.text.length.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Extracted text */}
      <div className="max-h-[500px] overflow-y-auto p-5">
        <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-[var(--color-charcoal)] selection:bg-[rgba(142,111,75,0.18)]">
          {parsed.text}
        </pre>
      </div>
    </div>
  );

  if (bare) {
    return (
      <div className="w-full">
        {dropzone}
        {resultPanel}
        {error && state !== "error" && (
          <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p>
        )}
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-76px)] max-w-[900px] items-start px-6 py-16">
      <section className="w-full rounded-[24px] border border-[var(--color-stone-mist)] bg-[var(--color-surface)] p-7 shadow-[0_16px_40px_rgba(41,37,36,0.08)] md:p-10">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-electric-indigo)]">
          Your workspace
        </span>
        <h1 className="mt-3 font-serif text-4xl tracking-[-0.03em] md:text-5xl">Parse Files</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-[var(--color-bark-grey)]">
          Upload a PDF to extract its text content for use with the pipeline tools.
          Text is extracted client-side and remains private.
        </p>
        <div className="mt-8">
          {dropzone}
          {resultPanel}
        </div>
      </section>
    </main>
  );
}
