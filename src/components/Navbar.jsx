import React from 'react';
import { 
  Moon, 
  Sun, 
  User, 
  Settings, 
  Code2,
  LayoutDashboard
} from 'lucide-react';
import Logo from './Logo';

export default function Navbar({
  theme,
  toggleTheme,
  user,
  onProfileClick,
  currentLanguage,
  setLanguage,
  viewMode,
  setViewMode,
  onOpenSettings,
  backendOnline
}) {
  const languages = [
    { id: 'javascript', label: 'JavaScript' },
    { id: 'python', label: 'Python' },
    { id: 'cpp', label: 'C++/C' },
    { id: 'java', label: 'Java' },
    { id: 'rust', label: 'Rust' }
  ];

  return (
    <header className="navbar">
      <div className="navbar-left">
        {/* Updated New OptiCode Logo Component */}
        <div className="brand-logo" onClick={() => setViewMode('editor')} title="OptiCode Editor Home">
          <Logo size={24} />
        </div>

        <div className="nav-divider"></div>

        {/* View Mode Toggle */}
        <div className="view-mode-tabs">
          <button 
            className={`view-tab ${viewMode === 'editor' ? 'active' : ''}`}
            onClick={() => setViewMode('editor')}
          >
            <Code2 size={15} />
            <span>IDE Editor</span>
          </button>
          <button 
            className={`view-tab ${viewMode === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              if (user.isLoggedIn) {
                setViewMode('dashboard');
              } else {
                onProfileClick();
              }
            }}
          >
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
          </button>
        </div>
      </div>


      {/* Center: Language Selector Pills */}
      <div className="navbar-center">
        <div className="language-pills">
          {languages.map(lang => (
            <button
              key={lang.id}
              className={`lang-pill ${currentLanguage === lang.id ? 'active' : ''}`}
              onClick={() => setLanguage(lang.id)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right Actions: Theme Toggle, Profile Icon, Settings */}
      <div className="navbar-right">
        {/* Moon / Sun Shaped Theme Toggle */}
        <button 
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Moon className="moon-icon" size={18} />
          ) : (
            <Sun className="sun-icon" size={18} />
          )}
        </button>

        {/* User Profile Trigger Button */}
        <button 
          className={`user-profile-btn ${user.isLoggedIn ? 'logged-in' : ''}`}
          onClick={onProfileClick}
          title={user.isLoggedIn ? `Logged in as ${user.username} (Click for Dashboard)` : 'Click to Login / Register'}
        >
          {user.isLoggedIn && user.avatar ? (
            <div className="user-avatar-wrap">
              <img src={user.avatar} alt={user.username} className="user-avatar" />
              <span className="online-indicator"></span>
            </div>
          ) : (
            <User size={18} />
          )}
        </button>

        <button 
          className="btn-icon"
          onClick={onOpenSettings}
          title="IDE Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
