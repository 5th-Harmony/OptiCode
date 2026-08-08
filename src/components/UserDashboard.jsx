import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Zap, 
  TrendingUp, 
  Code2, 
  Lock, 
  Mail, 
  Edit3, 
  Check, 
  ArrowRight,
  Shield,
  Sparkles,
  LogOut,
  Camera,
  X,
  FileSpreadsheet,
  Download,
  Clock,
  Briefcase,
  Layers,
  ChevronRight,
  BarChart3,
  CheckCircle2,
  Info,
  Upload
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80'
];

export default function UserDashboard({ user, onUpdateUser, onOpenEditor, onLogout }) {
  // File Input Ref for native device image upload
  const fileInputRef = useRef(null);

  // Account Form State
  const [username, setUsername] = useState(user.username || 'dev_architect_99');
  const [email, setEmail] = useState(user.email || 'alex.dev@opticode.io');
  const [role, setRole] = useState(user.role || 'Senior AI & Systems Architect');
  const [isSaved, setIsSaved] = useState(false);

  // Keep local form state in sync whenever the user prop changes
  // (e.g. after logout → re-login, or after another component calls onUpdateUser)
  useEffect(() => {
    setUsername(user.username || '');
    setEmail(user.email || '');
    setRole(user.role || '');
  }, [user.username, user.email, user.role]);

  // Modals & Active Views
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isFullReportOpen, setIsFullReportOpen] = useState(false);
  const [isHistoryLogOpen, setIsHistoryLogOpen] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [efficiencyPeriod, setEfficiencyPeriod] = useState('Weekly');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Device File Upload Handler
  const handleDeviceImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (PNG, JPG, WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result;
        if (base64Url) {
          onUpdateUser({ avatar: base64Url });
          showToast('Device profile picture uploaded & saved successfully!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAccount = (e) => {
    e.preventDefault();
    onUpdateUser({ username, email, role });
    setIsSaved(true);
    showToast('Account details saved to your profile!');
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSelectAvatar = (url) => {
    onUpdateUser({ avatar: url });
    setIsAvatarPickerOpen(false);
    showToast('Profile picture updated!');
  };

  return (
    <div className="dashboard-container">
      {/* Hidden File Input for Device Image Selection */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        style={{ display: 'none' }} 
        onChange={handleDeviceImageUpload} 
      />

      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="dashboard-toast">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Row */}
      <div className="dashboard-top-bar">
        <div className="user-profile-header">
          <div 
            className="avatar-wrapper" 
            onClick={() => fileInputRef.current?.click()} 
            title="Click to Upload Profile Picture from Device"
          >
            <img src={user.avatar} alt={username} className="profile-img" />
            <button className="avatar-edit-badge" title="Upload Device Image">
              <Camera size={12} />
            </button>
          </div>

          <div className="user-meta">
            <div className="user-name-row">
              <h1 className="user-handle">{username}</h1>
              {user.isPro && <span className="pro-badge">PRO MEMBER</span>}
            </div>
            <p className="user-email-text">
              <Mail size={13} />
              <span>{email}</span>
              <span className="bullet-sep">•</span>
              <Briefcase size={13} />
              <span>{role}</span>
            </p>
          </div>
        </div>

        <div className="dashboard-top-actions">
          <button 
            className="btn-secondary" 
            onClick={() => fileInputRef.current?.click()}
            title="Upload Profile Picture from Computer Device"
          >
            <Upload size={14} />
            <span>UPLOAD PICTURE</span>
          </button>

          <button 
            className="btn-secondary" 
            onClick={() => setIsEditProfileOpen(true)}
            title="Open Profile Editor Modal"
          >
            <Edit3 size={14} />
            <span>EDIT PROFILE</span>
          </button>

          {/* LOGOUT OPTION */}
          <button 
            className="btn-danger-outline" 
            onClick={() => {
              showToast('Logging out...');
              setTimeout(onLogout, 500);
            }}
            title="Log Out of OptiCode"
          >
            <LogOut size={14} />
            <span>LOGOUT</span>
          </button>
        </div>
      </div>

      {/* Grid Row 1: Interactive Statistics Cards */}
      <div className="stats-cards-grid">
        {/* Stat Card 1: Total Optimizations */}
        <div 
          className="stat-card clickable"
          onClick={() => setIsHistoryLogOpen(true)}
          title="Click to View Optimization History Log"
        >
          <div className="stat-card-header">
            <span className="stat-label">TOTAL OPTIMIZATIONS</span>
            <div className="stat-icon-badge blue">
              <Zap size={16} />
            </div>
          </div>
          <div className="stat-value-wrap">
            <span className="stat-number">{user.stats.totalOptimizations}</span>
            <span className="stat-delta">+{user.stats.weeklyIncrease} this week</span>
          </div>
          <div className="card-click-hint">
            <Clock size={12} />
            <span>View Full History</span>
          </div>
        </div>

        {/* Stat Card 2: Efficiency Gain */}
        <div 
          className="stat-card clickable"
          onClick={() => {
            const nextPeriod = efficiencyPeriod === 'Weekly' ? 'Monthly' : efficiencyPeriod === 'Monthly' ? 'All-Time' : 'Weekly';
            setEfficiencyPeriod(nextPeriod);
            showToast(`Switched stats view to ${nextPeriod} average.`);
          }}
          title="Click to toggle Weekly / Monthly / All-Time analytics"
        >
          <div className="stat-card-header">
            <span className="stat-label">EFFICIENCY GAIN ({efficiencyPeriod.toUpperCase()})</span>
            <div className="stat-icon-badge amber">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="stat-value-wrap">
            <span className="stat-number">
              +{efficiencyPeriod === 'Weekly' ? user.stats.efficiencyGain : efficiencyPeriod === 'Monthly' ? 58 : 64}%
            </span>
            <div className="efficiency-progress-bar">
              <div 
                className="bar-fill" 
                style={{ 
                  width: `${efficiencyPeriod === 'Weekly' ? user.stats.efficiencyGain : efficiencyPeriod === 'Monthly' ? 58 : 64}%` 
                }}
              ></div>
            </div>
          </div>
          <div className="card-click-hint">
            <BarChart3 size={12} />
            <span>Toggle: {efficiencyPeriod}</span>
          </div>
        </div>

        {/* Stat Card 3: Top Language */}
        <div 
          className="stat-card clickable"
          onClick={() => {
            showToast(`Filter workspace files by ${user.stats.topLanguage}`);
            onOpenEditor();
          }}
          title="Click to optimize top language files"
        >
          <div className="stat-card-header">
            <span className="stat-label">TOP LANGUAGE</span>
            <div className="stat-icon-badge sky">
              <Code2 size={16} />
            </div>
          </div>
          <div className="stat-value-wrap">
            <span className="stat-number lang-name">{user.stats.topLanguage}</span>
            <div className="language-dots">
              <span className="dot active"></span>
              <span className="dot active"></span>
              <span className="dot"></span>
            </div>
          </div>
          <div className="card-click-hint">
            <Layers size={12} />
            <span>Open JavaScript Editor</span>
          </div>
        </div>
      </div>

      {/* Grid Row 2: Account Settings & Optimization Insights */}
      <div className="dashboard-content-grid">
        {/* Left Box: Account Settings Form */}
        <div className="dash-card account-settings-card">
          <div className="dash-card-header">
            <Shield size={18} className="card-icon" />
            <h2>Account Settings</h2>
          </div>

          <form onSubmit={handleSaveAccount} className="account-form">
            <div className="form-group">
              <label>USERNAME</label>
              <div className="input-with-icon">
                <User size={15} className="field-icon" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>EMAIL ADDRESS</label>
              <div className="input-with-icon">
                <Mail size={15} className="field-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  required
                />
                <Lock size={14} className="lock-icon" title="Email domain locked" />
              </div>
            </div>

            <div className="form-group">
              <label>DEVELOPER ROLE / TITLE</label>
              <div className="input-with-icon">
                <Briefcase size={15} className="field-icon" />
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Senior AI Architect"
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => {
                  setUsername(user.username);
                  setEmail(user.email);
                  setRole(user.role || 'Senior AI & Systems Architect');
                  showToast('Reverted changes.');
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {isSaved ? (
                  <>
                    <Check size={16} />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Box: Optimization Insights */}
        <div className="dash-card insights-card">
          <div className="dash-card-header">
            <div className="header-title-wrap">
              <Sparkles size={18} className="card-icon icon-amber" />
              <h2>Optimization Insights</h2>
            </div>
            <span className="auto-gen-tag">Auto-Generated</span>
          </div>

          <p className="insights-subtitle">
            Based on your recent repository scans, click any issue below to inspect root cause breakdown.
          </p>

          <div className="insights-list">
            {user.insights.map((item) => (
              <div 
                key={item.id} 
                className="insight-item clickable"
                onClick={() => setSelectedInsight(item)}
                title="Click to view detail breakdown"
              >
                <div className="insight-header">
                  <span className={`insight-title ${item.severity}`}>{item.title}</span>
                  <span className="occurrence-count">{item.count} occurrences</span>
                </div>
                <p className="insight-desc">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="insights-footer">
            <button 
              className="view-report-link" 
              onClick={() => setIsFullReportOpen(true)}
              title="Generate & View Full Optimization Audit Report"
            >
              <span>View Full Report & Optimize Files</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div className="modal-overlay" onClick={() => setIsEditProfileOpen(false)}>
          <div className="modal-content dash-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div className="title-with-icon">
                <Edit3 size={18} className="icon-blue" />
                <h3>Edit Developer Profile</h3>
              </div>
              <button className="modal-close" onClick={() => setIsEditProfileOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="form-group">
              <label>Full Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="form-input" 
              />
            </div>

            <div className="form-group">
              <label>Developer Title / Stack</label>
              <input 
                type="text" 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                className="form-input" 
              />
            </div>

            <div className="form-group">
              <label>Device Image Upload</label>
              <button 
                type="button" 
                className="btn-secondary full-width"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} />
                <span>Select Image from Computer</span>
              </button>
            </div>

            <div className="modal-footer-row">
              <button 
                className="btn-primary full-width" 
                onClick={() => {
                  onUpdateUser({ username, role });
                  setIsEditProfileOpen(false);
                  showToast('Profile updated!');
                }}
              >
                <Check size={16} />
                <span>Save Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AVATAR PICKER MODAL */}
      {isAvatarPickerOpen && (
        <div className="modal-overlay" onClick={() => setIsAvatarPickerOpen(false)}>
          <div className="modal-content dash-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div className="title-with-icon">
                <Camera size={18} className="icon-blue" />
                <h3>Choose Profile Avatar</h3>
              </div>
              <button className="modal-close" onClick={() => setIsAvatarPickerOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="avatar-grid">
              {PRESET_AVATARS.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Avatar ${i + 1}`}
                  className={`avatar-option ${user.avatar === url ? 'selected' : ''}`}
                  onClick={() => handleSelectAvatar(url)}
                />
              ))}
            </div>

            <div className="modal-footer-row">
              <button 
                type="button" 
                className="btn-secondary full-width"
                onClick={() => {
                  setIsAvatarPickerOpen(false);
                  fileInputRef.current?.click();
                }}
              >
                <Upload size={14} />
                <span>Upload Custom Image from Device</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: FULL OPTIMIZATION AUDIT REPORT MODAL */}
      {isFullReportOpen && (
        <div className="modal-overlay" onClick={() => setIsFullReportOpen(false)}>
          <div className="modal-content dash-modal-box wide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div className="title-with-icon">
                <FileSpreadsheet size={20} className="icon-amber" />
                <h3>Repository Optimization Audit Report</h3>
              </div>
              <button className="modal-close" onClick={() => setIsFullReportOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="report-body">
              <div className="report-summary-bar">
                <div className="summary-item">
                  <span className="lbl">Scanned Files</span>
                  <span className="val">5 Files</span>
                </div>
                <div className="summary-item">
                  <span className="lbl">Total Issues</span>
                  <span className="val amber">85 Bottlenecks</span>
                </div>
                <div className="summary-item">
                  <span className="lbl">Avg Speedup</span>
                  <span className="val green">+52% Speedup</span>
                </div>
              </div>

              <h4>Detected Refactoring Opportunities</h4>
              <ul className="report-issue-list">
                <li>
                  <span className="tag high">High</span>
                  <div>
                    <strong>DataGrid.js:</strong> Imperative `for` loop manual array copying. Recommendation: Replace with `.filter()` & `.map()`.
                  </div>
                </li>
                <li>
                  <span className="tag high">High</span>
                  <div>
                    <strong>algo.py:</strong> Quadratic $O(n^2)$ duplicate search & $O(2^n)$ Fibonacci. Recommendation: Switch to $O(n)$ Hash Set + LRU Memoization.
                  </div>
                </li>
                <li>
                  <span className="tag medium">Medium</span>
                  <div>
                    <strong>quick_sort.cpp:</strong> Repeated vector heap reallocations. Recommendation: Call `vector.reserve()`.
                  </div>
                </li>
                <li>
                  <span className="tag high">High</span>
                  <div>
                    <strong>MatrixAlgo.java:</strong> $O(n^3)$ cubic matrix multiplication & String loop concatenation. Recommendation: Reorder loop indexing & use `StringBuilder`.
                  </div>
                </li>
                <li>
                  <span className="tag high">High</span>
                  <div>
                    <strong>data_processor.rs:</strong> Clone-heavy vector iterations. Recommendation: Use zero-copy `into_iter()` pipeline.
                  </div>
                </li>
              </ul>
            </div>

            <div className="modal-footer-row space-between">
              <button 
                className="btn-secondary"
                onClick={() => showToast('Exporting PDF audit report...')}
              >
                <Download size={14} />
                <span>Export PDF</span>
              </button>
              <button 
                className="btn-primary" 
                onClick={() => {
                  setIsFullReportOpen(false);
                  onOpenEditor();
                }}
              >
                <span>Optimize Workspace Now</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: OPTIMIZATION HISTORY LOG MODAL */}
      {isHistoryLogOpen && (
        <div className="modal-overlay" onClick={() => setIsHistoryLogOpen(false)}>
          <div className="modal-content dash-modal-box wide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div className="title-with-icon">
                <Clock size={20} className="icon-blue" />
                <h3>Recent Optimization Activity Log</h3>
              </div>
              <button className="modal-close" onClick={() => setIsHistoryLogOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="history-list">
              <div className="history-item">
                <div className="history-time">10 mins ago</div>
                <div className="history-details">
                  <strong>DataGrid.js</strong> optimized algorithm from imperative loop to vectorized functional stream.
                </div>
                <div className="history-gain green">+68% Speed</div>
              </div>
              <div className="history-item">
                <div className="history-time">2 hours ago</div>
                <div className="history-details">
                  <strong>algo.py</strong> refactored duplicate search from $O(n^2)$ quadratic to $O(n)$ hash set.
                </div>
                <div className="history-gain green">+94% Speed</div>
              </div>
              <div className="history-item">
                <div className="history-time">Yesterday</div>
                <div className="history-details">
                  <strong>quick_sort.cpp</strong> eliminated dynamic vector reallocation overhead.
                </div>
                <div className="history-gain green">+87% Speed</div>
              </div>
            </div>

            <div className="modal-footer-row">
              <button className="btn-primary full-width" onClick={() => setIsHistoryLogOpen(false)}>
                <span>Close History</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: INSIGHT DETAIL MODAL */}
      {selectedInsight && (
        <div className="modal-overlay" onClick={() => setSelectedInsight(null)}>
          <div className="modal-content dash-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div className="title-with-icon">
                <Info size={18} className="icon-amber" />
                <h3>{selectedInsight.title}</h3>
              </div>
              <button className="modal-close" onClick={() => setSelectedInsight(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="insight-modal-body">
              <div className="occurrence-badge">
                <span>Total Detected Occurrences: <strong>{selectedInsight.count}</strong></span>
              </div>
              <p className="desc">{selectedInsight.description}</p>
              <h4>Recommended Fix:</h4>
              <p className="fix-text">
                Run OptiCode AI Engine on target workspace files to automatically synthesize zero-side-effect refactoring.
              </p>
            </div>

            <div className="modal-footer-row">
              <button 
                className="btn-primary full-width" 
                onClick={() => {
                  setSelectedInsight(null);
                  onOpenEditor();
                }}
              >
                <span>Jump to Editor & Fix</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
