import React from 'react';

interface LoadingPanelProps {
  status: string;
  progress?: { current: number; total: number };
}

const LoadingPanel: React.FC<LoadingPanelProps> = ({ status, progress }) => (
  <div className="flex-1 glow-card border border-card-border rounded-2xl p-8 flex flex-col items-center justify-center text-center">
    <div className="relative w-16 h-16 mb-4">
      <div className="absolute inset-0 rounded-full border-4 border-accent/20" />
      <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin" />
    </div>
    <h3 className="text-md font-semibold text-gray-200">Pipeline Executing</h3>
    <p className="text-xs text-accent font-medium mt-1 animate-pulse">{status}</p>
    {progress && (
      <div className="w-64 bg-gray-800 rounded-full h-1.5 mt-4 overflow-hidden border border-card-border">
        <div
          className="bg-accent h-full transition-all duration-500"
          style={{ width: `${(progress.current / progress.total) * 100}%` }}
        />
      </div>
    )}
  </div>
);

export default LoadingPanel;
