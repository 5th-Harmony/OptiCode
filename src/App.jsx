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

import { INITIAL_FILES, MOCK_USER_PROFILE } from './data/defaultFiles';
import { optimizeCodeWithBackend } from './utils/optimizerEngine';

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
  // If the stored files use the old numeric IDs ('1','2'…) instead of the
  // new semantic IDs ('js-1','py-1'…), wipe stale data so fresh defaults load.
  useEffect(() => {
    const storedFiles = localStorage.getItem('opticode_files');
    if (storedFiles) {
      try {
        const parsed = JSON.parse(storedFiles);
        const hasOldIds = parsed.some(f => /^\d+$/.test(f.id));
        if (hasOldIds) {
          localStorage.removeItem('opticode_files');
          localStorage.removeItem('opticode_file_optimizations');
          // Force page reload to pick up the clean INITIAL_FILES
          window.location.reload();
        }
      } catch (_) {
        localStorage.removeItem('opticode_files');
        localStorage.removeItem('opticode_file_optimizations');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Files Virtual Workspace State
  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem('opticode_files');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only use stored files if they have semantic IDs
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

  // Per-file isOptimizing: tracks WHICH fileId is currently being optimized.
  // null = nothing optimizing. Loading spinner only shows on the active file
  // being processed — switching files mid-optimization shows correct state.
  const [optimizingFileId, setOptimizingFileId] = useState(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [maxOptToast, setMaxOptToast] = useState(false); // 'Maximum optimization reached' toast

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState('terms');

  // IDE Settings State
  const [settings, setSettings] = useState({
    fontSize: 14,
    tabSize: 2,
    aiModel: 'opticode-3.6-pro',
    autoFormat: true,
    strictMode: true
  });

  // Sync Theme to body class
  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('opticode_theme', theme);
  }, [theme]);

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
        id: String(Date.now()),
        name: `sample_${langId}.${ext}`,
        path: `src/samples/sample_${langId}.${ext}`,
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
  };

  const handleCreateFile = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    let lang = 'javascript';
    if (ext === 'py') lang = 'python';
    if (ext === 'cpp' || ext === 'c') lang = 'cpp';
    if (ext === 'java') lang = 'java';
    if (ext === 'rs') lang = 'rust';

    const newFile = {
      id: String(Date.now()),
      name: name,
      path: `src/${name}`,
      language: lang,
      content: `// New file ${name}\n`
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  const handleDeleteFile = (fileId) => {
    if (files.length <= 1) return;
    const remaining = files.filter(f => f.id !== fileId);
    setFiles(remaining);
    if (activeFileId === fileId) {
      setActiveFileId(remaining[0].id);
    }
    // Remove optimization entry for deleted file
    setFileOptimizations(prev => {
      const updated = { ...prev };
      delete updated[fileId];
      return updated;
    });
  };

  // Trigger Code Optimization for Active File
  const handleOptimize = async () => {
    // Snapshot the file we're optimizing at the moment the button is clicked.
    // If the user switches files mid-optimization, we still store the result
    // under the correct original fileId, not the newly selected file.
    const targetFile = activeFile;
    if (!targetFile || optimizingFileId !== null) return;

    setOptimizingFileId(targetFile.id);

    try {
      const result = await optimizeCodeWithBackend(
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

      // Store result keyed by the FILE THAT WAS OPTIMIZED (not current active file)
      setFileOptimizations(prev => ({
        ...prev,
        [targetFile.id]: result
      }));

      setOptimizingFileId(null);
      setIsTerminalOpen(true); // Open terminal to show complexity analysis

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
      console.error('[OptiCode] Optimization failed:', err);
      setOptimizingFileId(null);
    }
  };

  // Apply Optimized Code back to Active Source File
  const handleApplyOptimization = () => {
    if (activeOptimizationResult && activeFile) {
      handleUpdateFileContent(activeFile.id, activeOptimizationResult.optimizedCode);
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
                activeFileId={activeFileId}
                onSelectFile={(id) => setActiveFileId(id)}
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
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
