import React from 'react';
import { X, Settings, Sliders, Cpu, Eye, Check, Sparkles, ShieldCheck, Zap } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="settings-modal-header">
          <div className="header-title-box">
            <div className="header-icon-badge">
              <Settings size={20} className="icon-blue" />
            </div>
            <div>
              <h2 className="modal-title">OptiCode IDE Settings</h2>
              <p className="modal-subtitle">Configure AI model engine, editor layout &amp; execution thresholds</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close Settings">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="settings-modal-body">
          
          {/* Section 1: AI Engine Model */}
          <div className="settings-section">
            <div className="section-label">
              <Cpu size={16} className="section-icon text-cyan" />
              <span>AI Optimizer Engine Model</span>
            </div>
            <p className="section-desc">Select the structural transformer engine used for time &amp; space complexity analysis.</p>
            <div className="select-wrapper">
              <select 
                value={settings.aiModel} 
                onChange={(e) => onUpdateSettings({ aiModel: e.target.value })}
                className="custom-settings-select"
              >
                <option value="opticode-3.6-pro">OptiCode 3.6 Pro — Neural AST Engine (Recommended)</option>
                <option value="deep-optimize-v2">DeepOptimize v2 — High-Throughput Heuristic Transformer</option>
                <option value="ast-transformer-fast">AST Fast — Micro-benchmarking Pipeline</option>
              </select>
            </div>
          </div>

          {/* Section 2: Editor Configuration */}
          <div className="settings-section">
            <div className="section-label">
              <Eye size={16} className="section-icon text-purple" />
              <span>Editor Typography &amp; Spacing</span>
            </div>
            
            {/* Font Size Slider */}
            <div className="control-row">
              <div className="control-info">
                <span className="control-name">Font Size</span>
                <span className="control-badge">{settings.fontSize}px</span>
              </div>
              <div className="slider-wrapper">
                <span className="slider-limit">12px</span>
                <input
                  type="range"
                  min="12"
                  max="20"
                  value={settings.fontSize}
                  onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
                  className="custom-range-slider"
                />
                <span className="slider-limit">20px</span>
              </div>
            </div>

            {/* Tab Spacing */}
            <div className="control-row">
              <div className="control-info">
                <span className="control-name">Tab Indentation</span>
                <span className="control-badge">{settings.tabSize} Spaces</span>
              </div>
              <div className="tab-pill-group">
                <button
                  className={`tab-pill-btn ${settings.tabSize === 2 ? 'active' : ''}`}
                  onClick={() => onUpdateSettings({ tabSize: 2 })}
                >
                  2 Spaces
                </button>
                <button
                  className={`tab-pill-btn ${settings.tabSize === 4 ? 'active' : ''}`}
                  onClick={() => onUpdateSettings({ tabSize: 4 })}
                >
                  4 Spaces
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Formatting & Analyzer Flags */}
          <div className="settings-section">
            <div className="section-label">
              <Sliders size={16} className="section-icon text-emerald" />
              <span>Automation &amp; Analyzer Thresholds</span>
            </div>

            {/* Auto Format Switch */}
            <div className="toggle-control-item">
              <div className="toggle-text">
                <span className="toggle-title">Auto-Format Code Post Optimization</span>
                <span className="toggle-sub">Automatically clean and format source code after AST transformation.</span>
              </div>
              <label className="custom-switch">
                <input
                  type="checkbox"
                  checked={settings.autoFormat}
                  onChange={(e) => onUpdateSettings({ autoFormat: e.target.checked })}
                />
                <span className="switch-slider round"></span>
              </label>
            </div>

            {/* Strict Mode Switch */}
            <div className="toggle-control-item">
              <div className="toggle-text">
                <span className="toggle-title">Strict Complexity Thresholds</span>
                <span className="toggle-sub">Enforce strict Big-O complexity boundary checks on all functions.</span>
              </div>
              <label className="custom-switch">
                <input
                  type="checkbox"
                  checked={settings.strictMode}
                  onChange={(e) => onUpdateSettings({ strictMode: e.target.checked })}
                />
                <span className="switch-slider round"></span>
              </label>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="settings-modal-footer">
          <button className="btn-apply-settings" onClick={onClose}>
            <Check size={16} />
            <span>Save &amp; Apply Preferences</span>
          </button>
        </div>

      </div>
    </div>
  );
}
