import React from 'react';
import { 
  Folder, 
  Search, 
  LayoutDashboard, 
  Settings, 
  Terminal,
  Zap
} from 'lucide-react';

export default function Sidebar({
  activePanel,
  setActivePanel,
  viewMode,
  setViewMode,
  toggleTerminal,
  isTerminalOpen,
  onOpenSettings
}) {
  return (
    <aside className="activity-bar">
      <div className="activity-top">
        {/* Explorer (Files) Icon */}
        <button
          className={`activity-btn ${viewMode === 'editor' && activePanel === 'explorer' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('editor');
            setActivePanel(activePanel === 'explorer' ? null : 'explorer');
          }}
          title="File Explorer (Ctrl+Shift+E)"
        >
          <Folder size={20} />
        </button>

        {/* Search & Replace Icon */}
        <button
          className={`activity-btn ${viewMode === 'editor' && activePanel === 'search' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('editor');
            setActivePanel(activePanel === 'search' ? null : 'search');
          }}
          title="Search Across Files (Ctrl+Shift+F)"
        >
          <Search size={20} />
        </button>

        {/* User Dashboard Direct Link */}
        <button
          className={`activity-btn ${viewMode === 'dashboard' ? 'active' : ''}`}
          onClick={() => setViewMode('dashboard')}
          title="User Dashboard & Optimization Insights"
        >
          <LayoutDashboard size={20} />
        </button>

        {/* Terminal Toggle Icon */}
        <button
          className={`activity-btn ${isTerminalOpen ? 'active' : ''}`}
          onClick={toggleTerminal}
          title="Toggle Terminal & Complexity Drawer (`)"
        >
          <Terminal size={20} />
        </button>
      </div>

      <div className="activity-bottom">
        {/* Settings Gear Icon at bottom */}
        <button
          className="activity-btn"
          onClick={onOpenSettings}
          title="IDE Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </aside>
  );
}
