"use client";
import React from "react";

export interface ConfigPanelProps {
  apiUrl: string;
  setApiUrl: (url: string) => void;
}

export default function ConfigPanel({ apiUrl, setApiUrl }: ConfigPanelProps) {
  return (
    <div className="animate-slideDown rounded-[14px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-4">
      <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-bark-grey)]">
        Backend API URL
      </label>
      <input
        type="text"
        value={apiUrl}
        onChange={(e) => setApiUrl(e.target.value)}
        placeholder="http://localhost:3001"
        className="mt-2 w-full rounded-lg border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] px-3 py-2 text-sm text-[var(--color-charcoal)] focus:border-[var(--color-electric-indigo)] focus:outline-none"
      />
      <p className="mt-2 text-[10px] text-[var(--color-pebble)]">
        Override the backend origin for advanced / self-hosted setups.
      </p>
    </div>
  );
}
