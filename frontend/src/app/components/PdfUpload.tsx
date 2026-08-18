"use client";
import React, { useRef, useState } from "react";

interface PdfUploadProps {
  /** Render without the full-page wrapper + intro heading so the tool can be
      embedded inside the authenticated workspace shell. */
  bare?: boolean;
}

export default function PdfUpload({ bare = false }: PdfUploadProps) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const choose = (selected?: File) => {
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      setMessage("Please select a PDF file.");
      return;
    }
    setFile(selected);
    setMessage("");
  };

  const dropzone = (
    <>
      <input
        ref={input}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={event => choose(event.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDrop={event => { event.preventDefault(); choose(event.dataTransfer.files[0]); }}
        onDragOver={event => event.preventDefault()}
        className="flex min-h-56 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] p-6 text-center transition hover:border-[var(--color-electric-indigo)]"
      >
        <svg className="h-9 w-9 text-[var(--color-electric-indigo)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 16V4m0 0L8 8m4-4 4 4M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
        </svg>
        <span className="mt-4 font-semibold">{file ? file.name : "Choose a PDF or drag it here"}</span>
        <span className="mt-1 text-sm text-[var(--color-bark-grey)]">PDF files only</span>
      </button>
      {file && (
        <div className="mt-5 flex items-center justify-between rounded-xl bg-[rgba(97,95,255,0.08)] p-4">
          <span className="truncate text-sm font-medium">{file.name}</span>
          <span className="text-sm text-[var(--color-electric-indigo)]">Ready to upload</span>
        </div>
      )}
      {message && <p className="mt-4 text-sm text-[var(--color-danger)]">{message}</p>}
    </>
  );

  if (bare) {
    return <div className="w-full">{dropzone}</div>;
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-76px)] max-w-[900px] items-center px-6 py-16">
      <section className="w-full rounded-[24px] border border-[var(--color-stone-mist)] bg-[var(--color-surface)] p-7 shadow-[0_16px_40px_rgba(41,37,36,0.08)] md:p-10">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-electric-indigo)]">Your workspace</span>
        <h1 className="mt-3 font-serif text-4xl tracking-[-0.03em] md:text-5xl">Upload a PDF</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-[var(--color-bark-grey)]">Add a PDF to your private workspace for processing and review.</p>
        <div className="mt-8">{dropzone}</div>
      </section>
    </main>
  );
}
