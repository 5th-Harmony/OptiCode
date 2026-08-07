import React, { useState } from 'react';
import { 
  FileCode, 
  Plus, 
  Trash2, 
  FileText, 
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  LayoutDashboard
} from 'lucide-react';

export default function FileExplorer({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  viewMode,
  setViewMode
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isExplorerExpanded, setIsExplorerExpanded] = useState(true);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (newFileName.trim()) {
      onCreateFile(newFileName.trim());
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const getLanguageIconColor = (lang) => {
    switch (lang) {
      case 'javascript': return '#F7DF1E';
      case 'python': return '#3776AB';
      case 'cpp': return '#00599C';
      case 'java': return '#ED8B00';
      case 'rust': return '#DEA584';
      default: return '#3B82F6';
    }
  };

  return (
    <div className="explorer-panel">
      <div className="explorer-header">
        <span className="explorer-title">EXPLORER</span>
        <div className="explorer-actions">
          <button 
            className="action-icon-btn" 
            onClick={() => setIsCreating(true)}
            title="New File"
          >
            <Plus size={16} />
          </button>
          <button className="action-icon-btn" title="More Options">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="explorer-tree">
        {/* Navigation Item for Dashboard (as shown in op3.jpg) */}
        <div 
          className={`explorer-item ${viewMode === 'dashboard' ? 'selected' : ''}`}
          onClick={() => setViewMode('dashboard')}
        >
          <LayoutDashboard size={15} className="item-icon dashboard-icon" />
          <span className="file-name">Dashboard</span>
        </div>

        {/* Root Workspace Folder Toggle */}
        <div 
          className="explorer-section-title"
          onClick={() => setIsExplorerExpanded(!isExplorerExpanded)}
        >
          {isExplorerExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>OPTICODE-WORKSPACE</span>
        </div>

        {isExplorerExpanded && (
          <div className="explorer-files-list">
            {/* New File Inline Input Form */}
            {isCreating && (
              <form onSubmit={handleCreateSubmit} className="new-file-form">
                <FileCode size={15} style={{ color: '#3B82F6' }} />
                <input
                  type="text"
                  autoFocus
                  placeholder="filename.js"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onBlur={() => setIsCreating(false)}
                  className="new-file-input"
                />
              </form>
            )}

            {/* List of Files */}
            {files.map(file => (
              <div
                key={file.id}
                className={`explorer-item ${viewMode === 'editor' && activeFileId === file.id ? 'selected' : ''}`}
                onClick={() => {
                  setViewMode('editor');
                  onSelectFile(file.id);
                }}
              >
                <FileCode 
                  size={15} 
                  className="item-icon"
                  style={{ color: getLanguageIconColor(file.language) }}
                />
                <span className="file-name">{file.name}</span>

                {files.length > 1 && (
                  <button
                    className="delete-file-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file.id);
                    }}
                    title="Delete File"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
