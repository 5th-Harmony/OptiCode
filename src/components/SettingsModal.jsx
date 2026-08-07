import React from 'react';
import { X, Settings, Sliders, Cpu, Eye, Check } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div className="title-with-icon">
            <Settings size={20} className="icon-blue" />
            <h2>OptiCode IDE Settings</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="settings-body">
          {/* AI Model Selection */}
          <div className="settings-group">
            <label className="settings-label">
              <Cpu size={15} />
              <span>AI Optimizer Engine Model</span>
            </label>
            <select 
              value={settings.aiModel} 
              onChange={(e) => onUpdateSettings({ aiModel: e.target.value })}
              className="form-input"
            >
              <option value="opticode-3.6-pro">OptiCode 3.6 Pro (Recommended)</option>
              <option value="deep-optimize-v2">DeepOptimize v2 (High Efficiency)</option>
              <option value="ast-transformer-fast">AST Transformer Fast</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="settings-group">
            <label className="settings-label">
              <Eye size={15} />
              <span>Editor Font Size ({settings.fontSize}px)</span>
            </label>
            <input
              type="range"
              min="12"
              max="20"
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
              className="range-input"
            />
          </div>

          {/* Tab Width */}
          <div className="settings-group">
            <label className="settings-label">
              <Sliders size={15} />
              <span>Tab Spacing</span>
            </label>
            <select
              value={settings.tabSize}
              onChange={(e) => onUpdateSettings({ tabSize: Number(e.target.value) })}
              className="form-input"
            >
              <option value={2}>2 Spaces</option>
              <option value={4}>4 Spaces</option>
            </select>
          </div>

          {/* Toggle Switches */}
          <div className="settings-toggle-row">
            <span>Auto-Format Code Post Optimization</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.autoFormat}
                onChange={(e) => onUpdateSettings({ autoFormat: e.target.checked })}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="settings-toggle-row">
            <span>Strict Complexity Analyzer Thresholds</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.strictMode}
                onChange={(e) => onUpdateSettings({ strictMode: e.target.checked })}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        <div className="modal-footer-row">
          <button className="btn-primary full-width" onClick={onClose}>
            <Check size={16} />
            <span>Apply Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
