import React from 'react';

interface ConfigPanelProps {
  apiUrl: string;
  setApiUrl: (url: string) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ apiUrl, setApiUrl }) => (
  <div className="glow-card rounded-2xl p-5 border border-card-border animate-fadeIn">
    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
      Backend API URL
    </label>
    <input
      type="text"
      value={apiUrl}
      onChange={(e) => setApiUrl(e.target.value)}
      placeholder="http://localhost:3001"
      className="w-full bg-[#0d111a] border border-card-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
    />
    <p className="text-[10px] text-gray-500 mt-2">
      Enter your locally hosted or deployed backend endpoint.
    </p>
  </div>
);

export default ConfigPanel;
