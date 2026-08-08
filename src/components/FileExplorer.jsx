import React, { useState } from 'react';
import { 
  FileCode, 
  Plus, 
  Trash2, 
  FileText, 
  Folder,
  FolderOpen,
  FolderPlus,
  FilePlus,
  ChevronRight,
  ChevronDown,
  LayoutDashboard
} from 'lucide-react';

export default function FileExplorer({
  files = [],
  folders = [],
  activeFileId,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onDeleteFolder,
  onMoveFileToFolder,
  viewMode,
  setViewMode
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [createMode, setCreateMode] = useState(null); // null | 'file' | 'folder'
  const [targetFolderId, setTargetFolderId] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({
    'folder-components': true,
    'folder-utils': true
  });
  const [isWorkspaceExpanded, setIsWorkspaceExpanded] = useState(true);
  const [draggedFileId, setDraggedFileId] = useState(null);
  const [dragOverFolderId, setDragOverFolderId] = useState(null);

  const toggleFolder = (folderId, e) => {
    if (e) e.stopPropagation();
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleStartCreate = (mode, folderId = null, e) => {
    if (e) e.stopPropagation();
    setCreateMode(mode);
    setTargetFolderId(folderId);
    setNewItemName('');
    setShowAddMenu(false);
    if (folderId) {
      setExpandedFolders(prev => ({ ...prev, [folderId]: true }));
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const name = newItemName.trim();
    if (!name) {
      setCreateMode(null);
      return;
    }
    if (createMode === 'file') {
      onCreateFile(name, targetFolderId);
    } else if (createMode === 'folder') {
      onCreateFolder(name, targetFolderId);
    }
    setNewItemName('');
    setCreateMode(null);
    setTargetFolderId(null);
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

  // Drag and drop handlers
  const handleDragStart = (e, fileId) => {
    e.stopPropagation();
    setDraggedFileId(fileId);
    e.dataTransfer.setData('text/plain', fileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverFolder = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverFolderId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleDragLeaveFolder = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverFolderId === folderId) {
      setDragOverFolderId(null);
    }
  };

  const handleDropFolder = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
    const fileId = e.dataTransfer.getData('text/plain') || draggedFileId;
    if (fileId && onMoveFileToFolder) {
      onMoveFileToFolder(fileId, folderId);
    }
    setDraggedFileId(null);
  };

  // Files in root workspace (folderId is null)
  const rootFiles = files.filter(f => !f.folderId);

  return (
    <div className="explorer-panel">
      {/* Explorer Panel Header */}
      <div className="explorer-header">
        <span className="explorer-title">EXPLORER</span>
        <div className="explorer-actions" style={{ position: 'relative' }}>
          
          {/* Plus (+) Button with 2 Choices Popover Dropdown */}
          <button 
            className={`action-icon-btn ${showAddMenu ? 'active' : ''}`}
            onClick={() => setShowAddMenu(prev => !prev)}
            title="Create File or Folder"
            id="btn-add-menu"
          >
            <Plus size={16} />
          </button>

          {/* Plus Options Menu */}
          {showAddMenu && (
            <div className="explorer-add-menu" onClick={e => e.stopPropagation()}>
              <button 
                className="add-menu-item"
                onClick={(e) => handleStartCreate('file', null, e)}
              >
                <FilePlus size={14} className="menu-icon-blue" />
                <span>New File</span>
              </button>
              <button 
                className="add-menu-item"
                onClick={(e) => handleStartCreate('folder', null, e)}
              >
                <FolderPlus size={14} className="menu-icon-amber" />
                <span>New Folder</span>
              </button>
            </div>
          )}

        </div>
      </div>

      <div className="explorer-tree" onClick={() => setShowAddMenu(false)}>
        
        {/* Navigation Item for Dashboard */}
        <div 
          className={`explorer-item ${viewMode === 'dashboard' ? 'selected' : ''}`}
          onClick={() => setViewMode('dashboard')}
        >
          <LayoutDashboard size={15} className="item-icon dashboard-icon" />
          <span className="file-name">Dashboard</span>
        </div>

        {/* Root Workspace Folder Toggle */}
        <div 
          className={`explorer-section-title ${dragOverFolderId === 'root' ? 'drag-over-root' : ''}`}
          onClick={() => setIsWorkspaceExpanded(!isWorkspaceExpanded)}
          onDragOver={(e) => handleDragOverFolder(e, 'root')}
          onDragLeave={(e) => handleDragLeaveFolder(e, 'root')}
          onDrop={(e) => handleDropFolder(e, null)}
        >
          {isWorkspaceExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>OPTICODE-WORKSPACE</span>
        </div>

        {isWorkspaceExpanded && (
          <div className="explorer-files-list">

            {/* Inline Input Form for Root Item Creation */}
            {createMode && targetFolderId === null && (
              <form onSubmit={handleCreateSubmit} className="new-item-form">
                {createMode === 'folder' ? (
                  <Folder size={15} style={{ color: '#F59E0B' }} />
                ) : (
                  <FileCode size={15} style={{ color: '#3B82F6' }} />
                )}
                <input
                  type="text"
                  autoFocus
                  placeholder={createMode === 'folder' ? 'Folder Name' : 'filename.js'}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onBlur={() => setCreateMode(null)}
                  className="new-file-input"
                />
              </form>
            )}

            {/* Render Folders Tree */}
            {folders.map(folder => {
              const isExpanded = !!expandedFolders[folder.id];
              const isDragOver = dragOverFolderId === folder.id;
              const folderFiles = files.filter(f => f.folderId === folder.id);

              return (
                <div key={folder.id} className="folder-tree-node">
                  {/* Folder Row */}
                  <div
                    className={`explorer-item folder-row ${isDragOver ? 'drag-over' : ''}`}
                    onClick={(e) => toggleFolder(folder.id, e)}
                    onDragOver={(e) => handleDragOverFolder(e, folder.id)}
                    onDragLeave={(e) => handleDragLeaveFolder(e, folder.id)}
                    onDrop={(e) => handleDropFolder(e, folder.id)}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronDown size={13} className="chevron-toggle" />
                        <FolderOpen size={15} className="folder-icon open" />
                      </>
                    ) : (
                      <>
                        <ChevronRight size={13} className="chevron-toggle" />
                        <Folder size={15} className="folder-icon" />
                      </>
                    )}
                    <span className="folder-name">{folder.name}</span>

                    {/* Folder Inline Action Buttons */}
                    <div className="folder-inline-actions">
                      <button
                        className="folder-action-btn"
                        onClick={(e) => handleStartCreate('file', folder.id, e)}
                        title="New File in Folder"
                      >
                        <FilePlus size={12} />
                      </button>
                      <button
                        className="folder-action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFolder(folder.id);
                        }}
                        title="Delete Folder"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Folder Child Files */}
                  {isExpanded && (
                    <div className="folder-children-list">
                      {/* Inline Input for File creation inside Folder */}
                      {createMode === 'file' && targetFolderId === folder.id && (
                        <form onSubmit={handleCreateSubmit} className="new-item-form indented">
                          <FileCode size={15} style={{ color: '#3B82F6' }} />
                          <input
                            type="text"
                            autoFocus
                            placeholder="filename.js"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onBlur={() => setCreateMode(null)}
                            className="new-file-input"
                          />
                        </form>
                      )}

                      {folderFiles.map(file => (
                        <div
                          key={file.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, file.id)}
                          className={`explorer-item file-item indented ${viewMode === 'editor' && activeFileId === file.id ? 'selected' : ''}`}
                          onClick={() => {
                            setViewMode('editor');
                            onSelectFile(file.id);
                          }}
                        >
                          <FileCode 
                            size={14} 
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
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Root Files List (files without folderId) */}
            {rootFiles.map(file => (
              <div
                key={file.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, file.id)}
                className={`explorer-item file-item ${viewMode === 'editor' && activeFileId === file.id ? 'selected' : ''}`}
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
