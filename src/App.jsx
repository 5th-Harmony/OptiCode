import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FileExplorer from './components/FileExplorer';
import SearchPanel from './components/SearchPanel';
import CodeEditor from './components/CodeEditor';
import TerminalPanel from './components/TerminalPanel';
import UserDashboard from './components/UserDashboard';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import LegalModal from './components/LegalModal';

import { INITIAL_FILES, INITIAL_FOLDERS, MOCK_USER_PROFILE } from './data/defaultFiles';
import { runOptiCodeAgent } from './utils/optiCodeAgent';

export default function App() {
  // Theme state ('dark' or 'light')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('opticode_theme') || 'dark';
  });

  // User Authentication state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('opticode_user');
    return saved ? JSON.parse(saved) : { ...MOCK_USER_PROFILE, isLoggedIn: true };
  });

  // Navigation View ('editor' or 'dashboard')
  const [viewMode, setViewMode] = useState('editor');

  // Sidebar Active Panel ('explorer' | 'search' | null)
  const [activePanel, setActivePanel] = useState('explorer');

  // ── localStorage version guard ──────────────────────────────────────────
  useEffect(() => {
    const storedFiles = localStorage.getItem('opticode_files');
    if (storedFiles) {
      try {
        const parsed = JSON.parse(storedFiles);
        const hasOldIds = parsed.some(f => /^\d+$/.test(f.id));
        if (hasOldIds) {
          localStorage.removeItem('opticode_files');
          localStorage.removeItem('opticode_folders');
          localStorage.removeItem('opticode_file_optimizations');
          window.location.reload();
        }
      } catch (_) {
        localStorage.removeItem('opticode_files');
        localStorage.removeItem('opticode_folders');
        localStorage.removeItem('opticode_file_optimizations');
      }
    }
  }, []);

  // Folders State
  const [folders, setFolders] = useState(() => {
    const saved = localStorage.getItem('opticode_folders');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return INITIAL_FOLDERS;
  });

  // Files Virtual Workspace State
  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem('opticode_files');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.some(f => /^\d+$/.test(f.id))) return parsed;
      } catch (_) {}
    }
    return INITIAL_FILES;
  });

  const [activeFileId, setActiveFileId] = useState(() => {
    const saved = localStorage.getItem('opticode_files');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.some(f => /^\d+$/.test(f.id))) return parsed[0]?.id || 'js-1';
      } catch (_) {}
    }
    return INITIAL_FILES[0]?.id || 'js-1';
  });

  // PER-FILE OPTIMIZATION STATE MAP (keyed by fileId — isolated per file)
  const [fileOptimizations, setFileOptimizations] = useState(() => {
    const saved = localStorage.getItem('opticode_file_optimizations');
    if (!saved) return {};
    try { return JSON.parse(saved); } catch (_) { return {}; }
  });

  const [optimizingFileId, setOptimizingFileId] = useState(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [maxOptToast, setMaxOptToast] = useState(false);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState('terms');

  // IDE Settings State
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('opticode_settings');
    return saved ? JSON.parse(saved) : {
      fontSize: 14,
      tabSize: 2,
      aiModel: 'opticode-3.6-pro',
      autoFormat: true,
      strictMode: true
    };
  });

  // Dynamically apply settings to CSS variables
  useEffect(() => {
    localStorage.setItem('opticode_settings', JSON.stringify(settings));
    document.documentElement.style.setProperty('--editor-font-size', `${settings.fontSize}px`);
    document.documentElement.style.setProperty('--editor-tab-size', `${settings.tabSize}`);
  }, [settings]);

  // Sync Theme to body class
  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('opticode_theme', theme);
  }, [theme]);

  // Persist folders in localStorage
  useEffect(() => {
    localStorage.setItem('opticode_folders', JSON.stringify(folders));
  }, [folders]);

  // Persist files in localStorage
  useEffect(() => {
    localStorage.setItem('opticode_files', JSON.stringify(files));
  }, [files]);

  // Persist per-file optimizations map
  useEffect(() => {
    localStorage.setItem('opticode_file_optimizations', JSON.stringify(fileOptimizations));
  }, [fileOptimizations]);

  // Persist user profile
  useEffect(() => {
    localStorage.setItem('opticode_user', JSON.stringify(user));
  }, [user]);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  const activeOptimizationResult = fileOptimizations[activeFileId] || null;

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleProfileClick = () => {
    if (!user.isLoggedIn) {
      setIsAuthModalOpen(true);
    } else {
      setViewMode(prev => (prev === 'dashboard' ? 'editor' : 'dashboard'));
    }
  };

  const handleLogout = () => {
    setUser({ isLoggedIn: false, username: '', email: '', isPro: false, stats: MOCK_USER_PROFILE.stats, insights: MOCK_USER_PROFILE.insights });
    setViewMode('editor');
  };

  const handleOpenLegal = (tab = 'terms') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  const handleSelectLanguageFilter = (langId) => {
    const match = files.find(f => f.language === langId);
    if (match) {
      setActiveFileId(match.id);
      setViewMode('editor');
    } else {
      const extensionMap = { javascript: 'js', python: 'py', cpp: 'cpp', java: 'java', rust: 'rs' };
      const ext = extensionMap[langId] || 'txt';
      const newFile = {
        id: `file-${Date.now()}`,
        name: `sample_${langId}.${ext}`,
        folderId: null,
        path: `src/sample_${langId}.${ext}`,
        language: langId,
        content: `// Sample ${langId.toUpperCase()} Code\nfunction sample() {\n  // Code ready for optimization\n}`
      };
      setFiles(prev => [...prev, newFile]);
      setActiveFileId(newFile.id);
      setViewMode('editor');
    }
  };

  // File Operations
  const handleUpdateFileContent = (fileId, newContent) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, content: newContent } : f));
    // If source code is modified, clear outdated optimization result for that file
    setFileOptimizations(prev => {
      if (!prev[fileId]) return prev;
      const updated = { ...prev };
      delete updated[fileId];
      return updated;
    });
  };

  const handleCreateFile = (name, targetFolderId = null) => {
    const ext = name.split('.').pop().toLowerCase();
    let lang = 'javascript';
    if (ext === 'py') lang = 'python';
    if (ext === 'cpp' || ext === 'c') lang = 'cpp';
    if (ext === 'java') lang = 'java';
    if (ext === 'rs') lang = 'rust';

    const targetFolder = folders.find(f => f.id === targetFolderId);
    const folderPath = targetFolder ? targetFolder.name : '';

    const newFile = {
      id: `file-${Date.now()}`,
      name: name,
      folderId: targetFolderId,
      path: folderPath ? `src/${folderPath}/${name}` : `src/${name}`,
      language: lang,
      content: `// New file ${name}\n`
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  const handleCreateFolder = (folderName, parentId = null) => {
    const newFolder = {
      id: `folder-${Date.now()}`,
      name: folderName,
      parentId: parentId
    };
    setFolders(prev => [...prev, newFolder]);
  };

  const handleDeleteFolder = (folderId) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
    setFiles(prev => prev.map(f => f.folderId === folderId ? { ...f, folderId: null } : f));
  };

  const handleMoveFileToFolder = (fileId, targetFolderId) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, folderId: targetFolderId } : f));
  };

  const handleDeleteFile = (fileId) => {
    if (files.length <= 1) return;
    const remaining = files.filter(f => f.id !== fileId);
    setFiles(remaining);
    if (activeFileId === fileId) {
      setActiveFileId(remaining[0].id);
    }
    setFileOptimizations(prev => {
      const updated = { ...prev };
      delete updated[fileId];
      return updated;
    });
  };

  // Trigger Code Optimization for Active File via OptiCode Agent
  const handleOptimize = async () => {
    const targetFile = activeFile;
    if (!targetFile || optimizingFileId !== null) return;

    setOptimizingFileId(targetFile.id);

    try {
      // Run the OptiCode Agent — 6-step read-analyze-classify-plan-transform-measure pipeline
      const result = await runOptiCodeAgent(
        targetFile.content,
        targetFile.language,
        targetFile.name
      );

      setOptimizingFileId(null);

      // Handle already-optimal case
      if (result.alreadyOptimal) {
        setMaxOptToast(true);
        setTimeout(() => setMaxOptToast(false), 4000);
        return;
      }

      // Store result keyed by the FILE THAT WAS OPTIMIZED (per-file isolation)
      setFileOptimizations(prev => ({
        ...prev,
        [targetFile.id]: result
      }));

      setOptimizingFileId(null);
      setIsTerminalOpen(true);

      // Record authentic usage telemetry into history
      const newLog = {
        id: `opt-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fileName: targetFile.name,
        language: targetFile.language,
        gain: result.timeEfficiencyGain || '+speedup',
        speedup: `${result.rawAnalysis?.issues?.[0]?.complexityBefore || result.timeBefore} → ${result.timeAfter}`,
        technique: result.spaceMemorySaved || 'Optimized'
      };

      try {
        const currentHist = JSON.parse(localStorage.getItem('opticode_analytics_history') || '[]');
        localStorage.setItem('opticode_analytics_history', JSON.stringify([newLog, ...currentHist].slice(0, 30)));
      } catch (_) {}

      // Update User Stats if logged in
      if (user.isLoggedIn) {
        setUser(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            totalOptimizations: (prev.stats?.totalOptimizations || 128) + 1,
            weeklyIncrease: (prev.stats?.weeklyIncrease || 14) + 1
          }
        }));
      }
    } catch (err) {
      console.error('[OptiCode Agent] Optimization failed:', err);
      setOptimizingFileId(null);
    }
  };

  // Apply Optimized Code back to Active Source File
  const handleApplyOptimization = () => {
    if (activeOptimizationResult && activeFile) {
      let codeToApply = activeOptimizationResult.optimizedCode;
      if (settings.autoFormat) {
        codeToApply = codeToApply.trim() + '\n';
      }
      handleUpdateFileContent(activeFile.id, codeToApply);
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar Header */}
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        user={user}
        onProfileClick={handleProfileClick}
        currentLanguage={activeFile?.language || 'javascript'}
        setLanguage={handleSelectLanguageFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOptimize={handleOptimize}
        isOptimizing={optimizingFileId === activeFileId}
      />

      {/* Maximum Optimization Reached Toast Banner Popup */}
      {maxOptToast && (
        <div className="max-opt-toast" role="alert">
          <div className="toast-content">
            <span className="toast-badge">OPTIMAL</span>
            <span className="toast-title">Maximum Optimization Reached</span>
            <span className="toast-desc">This code is already written using optimal data structures and minimal complexity.</span>
          </div>
          <button className="toast-close-btn" onClick={() => setMaxOptToast(false)}>✕</button>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="main-layout">
        {/* Left Vertical Activity Bar */}
        <Sidebar
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          viewMode={viewMode}
          setViewMode={setViewMode}
          toggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
          isTerminalOpen={isTerminalOpen}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />

        {/* Dynamic Sidebar Panel (File Explorer / Search) */}
        {viewMode === 'editor' && activePanel && (
          <aside className="sidebar-drawer">
            {activePanel === 'explorer' && (
              <FileExplorer
                files={files}
                folders={folders}
                activeFileId={activeFileId}
                onSelectFile={(id) => setActiveFileId(id)}
                onCreateFile={handleCreateFile}
                onCreateFolder={handleCreateFolder}
                onDeleteFile={handleDeleteFile}
                onDeleteFolder={handleDeleteFolder}
                onMoveFileToFolder={handleMoveFileToFolder}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
            )}

            {activePanel === 'search' && (
              <SearchPanel
                files={files}
                onSelectFile={(id) => setActiveFileId(id)}
              />
            )}
          </aside>
        )}

        {/* Center Canvas Area: IDE Dual Editor OR User Dashboard */}
        <main className="workspace-area">
          {viewMode === 'editor' ? (
            <CodeEditor
              key={activeFileId}
              activeFile={activeFile}
              onUpdateContent={handleUpdateFileContent}
              onOptimize={handleOptimize}
              optimizedResult={activeOptimizationResult}
              isOptimizing={optimizingFileId === activeFileId}
              onApplyOptimization={handleApplyOptimization}
            />
          ) : (
            <UserDashboard
              user={user}
              files={files}
              fileOptimizations={fileOptimizations}
              onUpdateUser={(updated) => setUser(prev => ({ ...prev, ...updated }))}
              onOpenEditor={() => {
                setViewMode('editor');
                handleOptimize();
              }}
              onLogout={handleLogout}
            />
          )}

          {/* Sliding Terminal & Complexity Bar (Bottom Drawer) */}
          {viewMode === 'editor' && (
            <TerminalPanel
              isOpen={isTerminalOpen}
              onToggle={() => setIsTerminalOpen(!isTerminalOpen)}
              optimizedResult={activeOptimizationResult}
              activeFile={activeFile}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(loggedInUser) => {
          setUser(prev => ({ ...MOCK_USER_PROFILE, ...loggedInUser }));
          setIsAuthModalOpen(false);
          setViewMode('dashboard');
        }}
        onOpenLegal={handleOpenLegal}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={(newSet) => setSettings(prev => ({ ...prev, ...newSet }))}
      />

      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />
    </div>
  );
}
