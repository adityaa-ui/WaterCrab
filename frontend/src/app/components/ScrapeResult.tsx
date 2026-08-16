import React from 'react';

interface ScrapeResultProps {
  title: string;
  excerpt?: string;
  markdown: string;
  activeTab: 'preview' | 'markdown';
  setActiveTab: (tab: 'preview' | 'markdown') => void;
  onCopy: (text: string) => void;
  copied: boolean;
}

const ScrapeResult: React.FC<ScrapeResultProps> = ({ title, excerpt, markdown, activeTab, setActiveTab, onCopy, copied }) => (
  <div className="flex-1 flex flex-col bg-card-bg border border-card-border rounded-2xl overflow-hidden shadow-2xl">
    <div className="px-5 py-3 border-b border-card-border bg-[#0a0d15] flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className="text-xs font-semibold text-white truncate max-w-xs">{title}</span>
        <span className="text-[9px] bg-accent/15 text-accent px-1.5 py-0.5 rounded font-bold uppercase">Scraped</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex bg-[#111622] rounded-lg p-0.5 border border-card-border">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 text-[10px] font-semibold rounded-md transition ${activeTab === 'preview' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('markdown')}
            className={`px-3 py-1 text-[10px] font-semibold rounded-md transition ${activeTab === 'markdown' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Markdown
          </button>
        </div>
        <button
          onClick={() => onCopy(markdown)}
          className="p-1.5 rounded-lg border border-card-border hover:bg-gray-800 text-gray-400 hover:text-white transition"
          title="Copy Markdown"
        >
          {copied ? (
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
          )}
        </button>
      </div>
    </div>
    <div className="flex-1 p-5 overflow-auto max-h-[500px]">
      {activeTab === 'markdown' ? (
        <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap selection:bg-accent/30">{markdown}</pre>
      ) : (
        <div className="prose prose-invert prose-xs text-gray-300 max-w-none">
          <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
          {excerpt && (
            <blockquote className="border-l-2 border-accent pl-3 text-gray-400 text-xs italic mb-4">{excerpt}</blockquote>
          )}
          <div className="whitespace-pre-line text-sm leading-relaxed">{markdown}</div>
        </div>
      )}
    </div>
  </div>
);

export default ScrapeResult;
