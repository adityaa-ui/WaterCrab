import React from 'react';

interface CrawlResultProps {
  crawlResult: {
    id: string;
    status: string;
    progress?: { current: number; total: number };
    results: Array<{ url: string; title: string; markdown: string }>;
    error?: string;
  } | null;
  selectedPage: number | null;
  setSelectedPage: (idx: number) => void;
  onCopy: (text: string) => void;
  copied: boolean;
}

const CrawlResult: React.FC<CrawlResultProps> = ({
  crawlResult,
  selectedPage,
  setSelectedPage,
  onCopy,
  copied,
}) => {
  if (!crawlResult) return null;

  const hasResults = crawlResult.results && crawlResult.results.length > 0;

  return (
    <div className="flex-1 flex flex-col bg-card-bg border border-card-border rounded-2xl overflow-hidden shadow-2xl">
      <div className="px-5 py-3 border-b border-card-border bg-[#0a0d15] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-white">Crawled Website Content</span>
          <span className="text-[9px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase">Crawl</span>
        </div>
        <div className="text-xs text-gray-400">
          Total pages: <span className="text-white font-bold">{crawlResult.results?.length || 0}</span>
        </div>
      </div>

      <div className="flex-1 flex grid grid-cols-1 md:grid-cols-12 min-h-0">
        {/* Pages List */}
        <div className="md:col-span-5 border-r border-card-border overflow-y-auto max-h-[450px]">
          {hasResults ? (
            <div className="divide-y divide-card-border">
              {crawlResult.results.map((page, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPage(index)}
                  className={`w-full text-left p-3 text-xs block transition ${
                    selectedPage === index
                      ? 'bg-accent/10 border-l-2 border-accent text-white'
                      : 'hover:bg-gray-800/40 text-gray-300'
                  }`}
                >
                  <span className="font-semibold block truncate mb-1">
                    {page.title || 'Page Title'}
                  </span>
                  <span className="text-[10px] text-gray-500 truncate block">{page.url}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-gray-500 italic">No pages crawled yet.</div>
          )}
        </div>

        {/* Page Viewer */}
        <div className="md:col-span-7 p-4 overflow-y-auto max-h-[450px] bg-[#07090f] flex flex-col">
          {selectedPage !== null && crawlResult.results && crawlResult.results[selectedPage] ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-card-border mb-3">
                <span className="text-[10px] text-gray-400 truncate max-w-xs block">
                  {crawlResult.results[selectedPage].url}
                </span>
                <button
                  onClick={() => onCopy(crawlResult.results[selectedPage].markdown)}
                  className="text-[10px] flex items-center space-x-1 hover:text-white text-gray-400 transition"
                >
                  {copied ? <span>Copied!</span> : <span>Copy Markdown</span>}
                </button>
              </div>
              <h3 className="text-sm font-bold text-white mb-2">
                {crawlResult.results[selectedPage].title}
              </h3>
              <pre className="text-[11px] font-mono text-gray-300 whitespace-pre-wrap flex-1 selection:bg-accent/30">
                {crawlResult.results[selectedPage].markdown}
              </pre>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-xs text-gray-500 italic">
              Select a page from the list to view its enqueued markdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrawlResult;
