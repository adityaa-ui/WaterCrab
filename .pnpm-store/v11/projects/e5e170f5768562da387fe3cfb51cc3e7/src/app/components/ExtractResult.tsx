import React from 'react';

interface ExtractResultProps {
  data: any;
  onCopy: (text: string) => void;
  copied: boolean;
}

const ExtractResult: React.FC<ExtractResultProps> = ({ data, onCopy, copied }) => (
  <div className="flex-1 flex flex-col bg-card-bg border border-card-border rounded-2xl overflow-hidden shadow-2xl">
    <div className="px-5 py-3 border-b border-card-border bg-[#0a0d15] flex items-center justify-between">
      <span className="text-xs font-semibold text-white">Extraction Output</span>
      <span className="text-[9px] bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded font-bold uppercase">JSON</span>
    </div>
    <button
      onClick={() => onCopy(JSON.stringify(data, null, 2))}
      className="p-1.5 rounded-lg border border-card-border hover:bg-gray-800 text-gray-400 hover:text-white transition"
      title="Copy JSON"
    >
      {copied ? (
        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
      )}
    </button>
    <div className="flex-1 p-5 bg-[#07090f] overflow-auto max-h-[500px]">
      <pre className="text-xs font-mono text-green-400 selection:bg-accent/30 whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  </div>
);

export default ExtractResult;
