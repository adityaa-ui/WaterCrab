"use client";

import React, { useCallback, useRef, useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  GlobeIcon,
  SparkIcon,
  UploadIcon,
  DocumentIcon
} from "@/lib/icons";
import { downloadText } from "@/lib/download";
import { DEFAULT_API_URL, performLeadGen, validateUrl } from "@/lib/jobs";
import type { LeadGenResponse } from "@/lib/types";

interface LeadGenToolProps {
  bare?: boolean;
  initialUrl?: string;
}

type InputTab = "url" | "file" | "text";

export default function LeadGenTool({ bare = false, initialUrl }: LeadGenToolProps) {
  const [apiUrl] = useState(DEFAULT_API_URL);
  const [tab, setTab] = useState<InputTab>("url");
  const [url, setUrl] = useState(initialUrl || "");
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LeadGenResponse | null>(null);
  const [activeLeadTab, setActiveLeadTab] = useState<"emails" | "phones" | "socials" | "websites">("emails");

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetAll = () => {
    setUrl("");
    setRawText("");
    setFile(null);
    setError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCopy = (textToCopy: string, key: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const processFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);
    setStatusMessage(`Parsing document "${selectedFile.name}"…`);
    setError(null);

    try {
      let extractedText = "";
      if (selectedFile.type === "application/pdf") {
        // Attempt backend PDF parse or ArrayBuffer text extraction fallback
        try {
          const formData = new FormData();
          formData.append("file", selectedFile);
          const pdfRes = await fetch(`${apiUrl}/parse-pdf`, { method: "POST", body: formData });
          if (pdfRes.ok) {
            const data = await pdfRes.json();
            extractedText = data.text || "";
          } else {
            throw new Error("Backend parse fallback");
          }
        } catch {
          const buffer = await selectedFile.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          const raw = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
          const chunks = raw.match(/[\x20-\x7E\n\r\t]{4,}/g) ?? [];
          extractedText = chunks.join(" ").replace(/\s+/g, " ").trim();
        }
      } else {
        // Plain text, CSV, JSON, MD files
        extractedText = await selectedFile.text();
      }

      if (!extractedText.trim()) {
        throw new Error("Could not extract readable text from this file.");
      }

      setStatusMessage("Extracting emails, phone numbers, and social leads…");
      const data = await performLeadGen(
        { text: extractedText, sourceType: "file", fileName: selectedFile.name },
        apiUrl
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file for leads.");
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  }, [apiUrl]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) {
        void processFile(dropped);
      }
    },
    [processFile]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === "url") {
        const urlErr = validateUrl(url);
        if (urlErr) {
          setError(urlErr);
          setLoading(false);
          return;
        }
        setStatusMessage(`Rendering webpage & scanning for leads…`);
        const data = await performLeadGen({ url: url.trim() }, apiUrl);
        setResult(data);
      } else if (tab === "text") {
        if (!rawText.trim()) {
          setError("Please paste or type text to parse.");
          setLoading(false);
          return;
        }
        setStatusMessage("Extracting leads from raw text…");
        const data = await performLeadGen(
          { text: rawText, sourceType: "text", fileName: "Pasted Text" },
          apiUrl
        );
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lead generation failed.");
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  const exportCSV = () => {
    if (!result?.leads) return;

    const rows: string[] = ["Type,Value,Domain/Details,Category"];
    
    result.leads.emails.forEach(e => {
      rows.push(`"Email","${e.email}","${e.domain}","${e.type}"`);
    });
    result.leads.phones.forEach(p => {
      rows.push(`"Phone","${p.phone}","${p.rawDigits}","${p.type}"`);
    });
    result.leads.socials.forEach(s => {
      rows.push(`"Social","${s.platform}","${s.url}","${s.handle}"`);
    });

    const csvContent = rows.join("\n");
    const sourceStem = (result.source?.name || "leads").replace(/[^a-zA-Z0-9_-]/g, "_");
    downloadText(`${sourceStem}_leads.csv`, csvContent, "text/csv;charset=utf-8");
  };

  const exportJSON = () => {
    if (!result) return;
    const jsonContent = JSON.stringify(result, null, 2);
    const sourceStem = (result.source?.name || "leads").replace(/[^a-zA-Z0-9_-]/g, "_");
    downloadText(`${sourceStem}_leads.json`, jsonContent, "application/json;charset=utf-8");
  };

  const copyAllEmails = () => {
    if (!result?.leads?.emails.length) return;
    const emailList = result.leads.emails.map(e => e.email).join("\n");
    handleCopy(emailList, "all-emails");
  };

  const copyAllPhones = () => {
    if (!result?.leads?.phones.length) return;
    const phoneList = result.leads.phones.map(p => p.phone).join("\n");
    handleCopy(phoneList, "all-phones");
  };

  const emailsCount = result?.summary?.totalEmails || 0;
  const phonesCount = result?.summary?.totalPhones || 0;
  const socialsCount = result?.summary?.totalSocials || 0;
  const websitesCount = result?.summary?.totalWebsites || 0;

  return (
    <div className={bare ? "w-full" : "mx-auto max-w-[1100px] px-6 py-12"}>
      {!bare && (
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-bark-grey)]">
            <SparkIcon className="h-3 w-3 text-[var(--color-electric-indigo)]" />
            Lead Generation Engine
          </span>
          <h1 className="mt-4 font-serif text-3xl tracking-[-0.03em] text-[var(--color-charcoal)] md:text-5xl">
            Extract Emails, Phones & Social Leads.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--color-bark-grey)]">
            Insert any website URL, upload a PDF or document, or paste raw text to instantly parse verified emails, telephone numbers, and social profile links.
          </p>
        </div>
      )}

      {/* Input Card & Control Panel */}
      <div className="rounded-[22px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-6 shadow-[0_16px_40px_rgba(41,37,36,0.06)] md:p-8">
        {/* Source Tabs */}
        <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-[var(--color-stone-mist)] pb-4">
          <button
            type="button"
            onClick={() => setTab("url")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider transition ${
              tab === "url"
                ? "bg-[var(--color-electric-indigo)] text-white shadow-sm"
                : "bg-[var(--color-warm-bone)] text-[var(--color-bark-grey)] hover:text-[var(--color-charcoal)]"
            }`}
          >
            <GlobeIcon className="h-4 w-4" />
            Website URL
          </button>

          <button
            type="button"
            onClick={() => setTab("file")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider transition ${
              tab === "file"
                ? "bg-[var(--color-electric-indigo)] text-white shadow-sm"
                : "bg-[var(--color-warm-bone)] text-[var(--color-bark-grey)] hover:text-[var(--color-charcoal)]"
            }`}
          >
            <UploadIcon className="h-4 w-4" />
            Upload File (PDF/TXT)
          </button>

          <button
            type="button"
            onClick={() => setTab("text")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider transition ${
              tab === "text"
                ? "bg-[var(--color-electric-indigo)] text-white shadow-sm"
                : "bg-[var(--color-warm-bone)] text-[var(--color-bark-grey)] hover:text-[var(--color-charcoal)]"
            }`}
          >
            <DocumentIcon className="h-4 w-4" />
            Paste Raw Text
          </button>
        </div>

        {/* Tab 1: Website URL Form */}
        {tab === "url" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-charcoal)]">
                Target Website or Contact Page URL
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/contact or https://stripe.com"
                  required
                  className="w-full flex-1 rounded-xl border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] px-4 py-3.5 text-sm text-[var(--color-charcoal)] placeholder:text-[var(--color-pebble)] focus:border-[var(--color-electric-indigo)] focus:outline-none focus:ring-4 focus:ring-[rgba(97,95,255,0.15)]"
                />
                <button
                  type="submit"
                  disabled={loading || !url}
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--color-electric-indigo)] px-6 py-3.5 font-mono text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--color-deep-violet)] disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Parsing…
                    </span>
                  ) : (
                    "Generate Leads"
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: File Upload Dropzone */}
        {tab === "file" && (
          <div className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload PDF or Document Dropzone"
              onClick={() => !loading && fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && !loading && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative flex min-h-[180px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition select-none ${
                isDragging
                  ? "border-[var(--color-electric-indigo)] bg-[rgba(97,95,255,0.06)]"
                  : loading
                  ? "border-[var(--color-electric-indigo)] bg-[rgba(97,95,255,0.04)] cursor-wait"
                  : "border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] hover:border-[var(--color-electric-indigo)]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.csv,.json,.md,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void processFile(f);
                }}
              />

              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-electric-indigo)] border-t-transparent" />
                  <span className="font-semibold text-[var(--color-charcoal)]">{statusMessage}</span>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-2">
                  <DocumentIcon className="h-8 w-8 text-[var(--color-success)]" />
                  <span className="font-semibold text-[var(--color-charcoal)]">{file.name}</span>
                  <span className="text-xs text-[var(--color-bark-grey)]">
                    {(file.size / 1024).toFixed(1)} KB · Click or drag to change file
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <UploadIcon className="h-8 w-8 text-[var(--color-electric-indigo)]" />
                  <span className="font-semibold text-[var(--color-charcoal)]">
                    Drop your PDF, TXT, CSV or document here
                  </span>
                  <span className="text-xs text-[var(--color-bark-grey)]">
                    Supports .pdf, .txt, .csv, .json up to 20 MB
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Paste Raw Text */}
        {tab === "text" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-charcoal)]">
                Paste Text / Email Signatures / Document Content
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={6}
                placeholder="Paste any text containing emails like contact@company.com, phone numbers like +1 (555) 234-5678, or LinkedIn links..."
                className="w-full rounded-xl border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] p-4 font-mono text-xs text-[var(--color-charcoal)] placeholder:text-[var(--color-pebble)] focus:border-[var(--color-electric-indigo)] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !rawText.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--color-electric-indigo)] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--color-deep-violet)] disabled:opacity-50"
            >
              {loading ? "Extracting Leads…" : "Extract Leads from Text"}
            </button>
          </form>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.06)] p-4 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}
      </div>

      {/* Results Workspace */}
      {result && result.leads && (
        <div className="mt-8 space-y-6 animate-fadeIn">
          {/* Summary Stat Cards & Header */}
          <div className="flex flex-col gap-4 rounded-[22px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-6 shadow-[0_16px_40px_rgba(41,37,36,0.06)] md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-[rgba(94,165,0,0.28)] bg-[rgba(94,165,0,0.08)] px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-success)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                  Leads Parsed
                </span>
                <span className="font-mono text-xs font-semibold text-[var(--color-charcoal)]">
                  {result.source?.name}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--color-bark-grey)]">
                Found <strong className="text-[var(--color-charcoal)]">{result.summary?.totalLeads}</strong> total contact signals.
              </p>
            </div>

            {/* Quick Export Action Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={copyAllEmails}
                disabled={!emailsCount}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] px-3 py-2 font-mono text-xs font-semibold text-[var(--color-charcoal)] hover:border-[var(--color-electric-indigo)] disabled:opacity-40"
              >
                {copiedKey === "all-emails" ? <CheckIcon className="h-3.5 w-3.5 text-[var(--color-success)]" /> : <CopyIcon className="h-3.5 w-3.5" />}
                Copy Emails ({emailsCount})
              </button>

              <button
                type="button"
                onClick={copyAllPhones}
                disabled={!phonesCount}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] px-3 py-2 font-mono text-xs font-semibold text-[var(--color-charcoal)] hover:border-[var(--color-electric-indigo)] disabled:opacity-40"
              >
                {copiedKey === "all-phones" ? <CheckIcon className="h-3.5 w-3.5 text-[var(--color-success)]" /> : <CopyIcon className="h-3.5 w-3.5" />}
                Copy Phones ({phonesCount})
              </button>

              <button
                type="button"
                onClick={exportCSV}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--color-electric-indigo)] bg-[rgba(97,95,255,0.06)] px-3 py-2 font-mono text-xs font-semibold text-[var(--color-electric-indigo)] hover:bg-[rgba(97,95,255,0.12)]"
              >
                <DownloadIcon className="h-3.5 w-3.5" />
                Export CSV
              </button>

              <button
                type="button"
                onClick={exportJSON}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--color-stone-mist)] px-3 py-2 font-mono text-xs font-semibold text-[var(--color-bark-grey)] hover:text-[var(--color-charcoal)]"
              >
                JSON
              </button>

              <button
                type="button"
                onClick={resetAll}
                className="rounded-lg border border-transparent px-3 py-2 font-mono text-xs font-semibold uppercase text-[var(--color-bark-grey)] hover:text-[var(--color-danger)]"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <button
              type="button"
              onClick={() => setActiveLeadTab("emails")}
              className={`flex flex-col rounded-2xl border p-4 text-left transition ${
                activeLeadTab === "emails"
                  ? "border-[var(--color-electric-indigo)] bg-[rgba(97,95,255,0.05)] shadow-sm"
                  : "border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] hover:border-[var(--color-electric-indigo)]"
              }`}
            >
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-bark-grey)]">
                Email Addresses
              </span>
              <span className="mt-1 font-mono text-2xl font-bold text-[var(--color-charcoal)]">
                {emailsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLeadTab("phones")}
              className={`flex flex-col rounded-2xl border p-4 text-left transition ${
                activeLeadTab === "phones"
                  ? "border-[var(--color-electric-indigo)] bg-[rgba(97,95,255,0.05)] shadow-sm"
                  : "border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] hover:border-[var(--color-electric-indigo)]"
              }`}
            >
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-bark-grey)]">
                Phone Numbers
              </span>
              <span className="mt-1 font-mono text-2xl font-bold text-[var(--color-charcoal)]">
                {phonesCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLeadTab("socials")}
              className={`flex flex-col rounded-2xl border p-4 text-left transition ${
                activeLeadTab === "socials"
                  ? "border-[var(--color-electric-indigo)] bg-[rgba(97,95,255,0.05)] shadow-sm"
                  : "border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] hover:border-[var(--color-electric-indigo)]"
              }`}
            >
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-bark-grey)]">
                Social Profiles
              </span>
              <span className="mt-1 font-mono text-2xl font-bold text-[var(--color-charcoal)]">
                {socialsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLeadTab("websites")}
              className={`flex flex-col rounded-2xl border p-4 text-left transition ${
                activeLeadTab === "websites"
                  ? "border-[var(--color-electric-indigo)] bg-[rgba(97,95,255,0.05)] shadow-sm"
                  : "border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] hover:border-[var(--color-electric-indigo)]"
              }`}
            >
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-bark-grey)]">
                Discovered Domains
              </span>
              <span className="mt-1 font-mono text-2xl font-bold text-[var(--color-charcoal)]">
                {websitesCount}
              </span>
            </button>
          </div>

          {/* Lead Table Container */}
          <div className="overflow-hidden rounded-[22px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] shadow-[0_16px_40px_rgba(41,37,36,0.06)]">
            {/* Table Header Tabs */}
            <div className="flex border-b border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] px-4">
              <button
                type="button"
                onClick={() => setActiveLeadTab("emails")}
                className={`border-b-2 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider transition ${
                  activeLeadTab === "emails"
                    ? "border-[var(--color-electric-indigo)] text-[var(--color-electric-indigo)]"
                    : "border-transparent text-[var(--color-bark-grey)] hover:text-[var(--color-charcoal)]"
                }`}
              >
                Emails ({emailsCount})
              </button>

              <button
                type="button"
                onClick={() => setActiveLeadTab("phones")}
                className={`border-b-2 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider transition ${
                  activeLeadTab === "phones"
                    ? "border-[var(--color-electric-indigo)] text-[var(--color-electric-indigo)]"
                    : "border-transparent text-[var(--color-bark-grey)] hover:text-[var(--color-charcoal)]"
                }`}
              >
                Phones ({phonesCount})
              </button>

              <button
                type="button"
                onClick={() => setActiveLeadTab("socials")}
                className={`border-b-2 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider transition ${
                  activeLeadTab === "socials"
                    ? "border-[var(--color-electric-indigo)] text-[var(--color-electric-indigo)]"
                    : "border-transparent text-[var(--color-bark-grey)] hover:text-[var(--color-charcoal)]"
                }`}
              >
                Social Profiles ({socialsCount})
              </button>

              <button
                type="button"
                onClick={() => setActiveLeadTab("websites")}
                className={`border-b-2 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider transition ${
                  activeLeadTab === "websites"
                    ? "border-[var(--color-electric-indigo)] text-[var(--color-electric-indigo)]"
                    : "border-transparent text-[var(--color-bark-grey)] hover:text-[var(--color-charcoal)]"
                }`}
              >
                Domains ({websitesCount})
              </button>
            </div>

            {/* Emails View */}
            {activeLeadTab === "emails" && (
              <div className="overflow-x-auto p-4">
                {result.leads.emails.length === 0 ? (
                  <div className="py-12 text-center text-sm text-[var(--color-bark-grey)]">
                    No email addresses were found in this source.
                  </div>
                ) : (
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-[var(--color-stone-mist)] text-[10px] uppercase text-[var(--color-bark-grey)]">
                        <th className="pb-3 pl-2">Email Address</th>
                        <th className="pb-3">Domain</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3 pr-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-stone-mist)]">
                      {result.leads.emails.map((e, idx) => (
                        <tr key={idx} className="group hover:bg-[var(--color-warm-bone)]">
                          <td className="py-3 pl-2 font-semibold text-[var(--color-charcoal)]">
                            {e.email}
                          </td>
                          <td className="py-3 text-[var(--color-bark-grey)]">{e.domain}</td>
                          <td className="py-3">
                            <span className="rounded bg-[rgba(97,95,255,0.08)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-electric-indigo)]">
                              {e.type}
                            </span>
                          </td>
                          <td className="py-3 pr-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleCopy(e.email, `email-${idx}`)}
                              className="inline-flex items-center gap-1 rounded border border-[var(--color-stone-mist)] bg-white px-2 py-1 text-[10px] text-[var(--color-bark-grey)] hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-charcoal)]"
                            >
                              {copiedKey === `email-${idx}` ? (
                                <CheckIcon className="h-3 w-3 text-[var(--color-success)]" />
                              ) : (
                                <CopyIcon className="h-3 w-3" />
                              )}
                              Copy
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Phones View */}
            {activeLeadTab === "phones" && (
              <div className="overflow-x-auto p-4">
                {result.leads.phones.length === 0 ? (
                  <div className="py-12 text-center text-sm text-[var(--color-bark-grey)]">
                    No phone numbers were found in this source.
                  </div>
                ) : (
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-[var(--color-stone-mist)] text-[10px] uppercase text-[var(--color-bark-grey)]">
                        <th className="pb-3 pl-2">Phone Number</th>
                        <th className="pb-3">Raw Digits</th>
                        <th className="pb-3">Network/Format</th>
                        <th className="pb-3 pr-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-stone-mist)]">
                      {result.leads.phones.map((p, idx) => (
                        <tr key={idx} className="group hover:bg-[var(--color-warm-bone)]">
                          <td className="py-3 pl-2 font-semibold text-[var(--color-charcoal)]">
                            {p.phone}
                          </td>
                          <td className="py-3 text-[var(--color-bark-grey)]">{p.rawDigits}</td>
                          <td className="py-3">
                            <span className="rounded bg-[rgba(34,184,205,0.08)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-tide-teal)]">
                              {p.type}
                            </span>
                          </td>
                          <td className="py-3 pr-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleCopy(p.phone, `phone-${idx}`)}
                              className="inline-flex items-center gap-1 rounded border border-[var(--color-stone-mist)] bg-white px-2 py-1 text-[10px] text-[var(--color-bark-grey)] hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-charcoal)]"
                            >
                              {copiedKey === `phone-${idx}` ? (
                                <CheckIcon className="h-3 w-3 text-[var(--color-success)]" />
                              ) : (
                                <CopyIcon className="h-3 w-3" />
                              )}
                              Copy
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Social Profiles View */}
            {activeLeadTab === "socials" && (
              <div className="overflow-x-auto p-4">
                {result.leads.socials.length === 0 ? (
                  <div className="py-12 text-center text-sm text-[var(--color-bark-grey)]">
                    No social media profiles were found in this source.
                  </div>
                ) : (
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-[var(--color-stone-mist)] text-[10px] uppercase text-[var(--color-bark-grey)]">
                        <th className="pb-3 pl-2">Platform</th>
                        <th className="pb-3">Handle / ID</th>
                        <th className="pb-3">URL</th>
                        <th className="pb-3 pr-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-stone-mist)]">
                      {result.leads.socials.map((s, idx) => (
                        <tr key={idx} className="group hover:bg-[var(--color-warm-bone)]">
                          <td className="py-3 pl-2 font-semibold text-[var(--color-charcoal)]">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-stone-mist)] bg-white px-2.5 py-0.5 text-[11px]">
                              {s.platform}
                            </span>
                          </td>
                          <td className="py-3 font-semibold text-[var(--color-electric-indigo)]">
                            {s.handle || "Profile"}
                          </td>
                          <td className="max-w-xs truncate py-3 text-[var(--color-bark-grey)]">
                            {s.url}
                          </td>
                          <td className="py-3 pr-2 text-right">
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded border border-[var(--color-stone-mist)] bg-white px-2 py-1 text-[10px] text-[var(--color-electric-indigo)] hover:border-[var(--color-electric-indigo)]"
                            >
                              Visit Profile ↗
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Websites View */}
            {activeLeadTab === "websites" && (
              <div className="overflow-x-auto p-4">
                {result.leads.websites.length === 0 ? (
                  <div className="py-12 text-center text-sm text-[var(--color-bark-grey)]">
                    No external domain references found.
                  </div>
                ) : (
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-[var(--color-stone-mist)] text-[10px] uppercase text-[var(--color-bark-grey)]">
                        <th className="pb-3 pl-2">Domain</th>
                        <th className="pb-3">URL</th>
                        <th className="pb-3 pr-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-stone-mist)]">
                      {result.leads.websites.map((w, idx) => (
                        <tr key={idx} className="group hover:bg-[var(--color-warm-bone)]">
                          <td className="py-3 pl-2 font-semibold text-[var(--color-charcoal)]">
                            {w.domain}
                          </td>
                          <td className="py-3 text-[var(--color-bark-grey)]">{w.url}</td>
                          <td className="py-3 pr-2 text-right">
                            <a
                              href={w.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded border border-[var(--color-stone-mist)] bg-white px-2 py-1 text-[10px] text-[var(--color-bark-grey)] hover:border-[var(--color-electric-indigo)]"
                            >
                              Visit ↗
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
