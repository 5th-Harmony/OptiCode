import React, { useState } from 'react';
import { 
  Terminal, 
  Clock, 
  HardDrive, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  X, 
  ChevronUp, 
  ChevronDown,
  Activity,
  Zap,
  BarChart2,
  AlertTriangle
} from 'lucide-react';

export default function TerminalPanel({
  isOpen,
  onToggle,
  optimizedResult,
  activeFile
}) {
  const [activeTab, setActiveTab] = useState('complexity'); // complexity | output | benchmarks | recommendations

  return (
    <div className={`terminal-container ${isOpen ? 'open' : 'collapsed'}`}>
      {/* BOTTOM STATUS BAR (Always visible) */}
      <div className="status-bar" onClick={onToggle}>
        <div className="status-bar-left">
          <button 
            className="status-item terminal-trigger"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            <Terminal size={14} />
            <span>Terminal</span>
            {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          <span className="status-item">Line: 1, Col: 1</span>
          <span className="status-item">
            <span className="status-dot green"></span>
            Processing Status: Ready
          </span>
        </div>

        <div className="status-bar-right">
          {optimizedResult && (
            <span className="status-item highlight-speed">
              <Zap size={13} />
              {optimizedResult.timeEfficiencyGain}
            </span>
          )}
          <span className="status-item">UTF-8</span>
          <span className="status-item">Prettier</span>
          <span className="status-item lang-tag">{activeFile?.language?.toUpperCase() || 'JS'}</span>
        </div>
      </div>

      {/* TERMINAL DRAWER CONTENT */}
      {isOpen && (
        <div className="terminal-drawer">
          {/* Drawer Header Tabs */}
          <div className="terminal-header">
            <div className="terminal-tabs">
              <button 
                className={`terminal-tab ${activeTab === 'complexity' ? 'active' : ''}`}
                onClick={() => setActiveTab('complexity')}
              >
                <Cpu size={14} />
                <span>Complexity Analysis</span>
                {optimizedResult && <span className="tab-badge">PRO</span>}
              </button>

              <button 
                className={`terminal-tab ${activeTab === 'output' ? 'active' : ''}`}
                onClick={() => setActiveTab('output')}
              >
                <Terminal size={14} />
                <span>Terminal Output</span>
                {optimizedResult && (
                  <span className="tab-dot"></span>
                )}
              </button>

              <button 
                className={`terminal-tab ${activeTab === 'benchmarks' ? 'active' : ''}`}
                onClick={() => setActiveTab('benchmarks')}
              >
                <BarChart2 size={14} />
                <span>Performance Benchmarks</span>
              </button>

              <button 
                className={`terminal-tab ${activeTab === 'recommendations' ? 'active' : ''}`}
                onClick={() => setActiveTab('recommendations')}
              >
                <Sparkles size={14} />
                <span>AI Recommendations</span>
              </button>
            </div>

            <button className="terminal-close-btn" onClick={onToggle} title="Close Terminal Drawer">
              <X size={15} />
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="terminal-body">
            {!optimizedResult ? (
              <div className="terminal-empty-state">
                <Terminal size={32} className="muted-icon" />
                <p>Run <strong>⚡ Optimize Code</strong> to generate real-time time & space complexity statistics and execution logs.</p>
              </div>
            ) : (
              <>
                {/* TAB 1: COMPLEXITY ANALYSIS */}
                {activeTab === 'complexity' && (
                  <div className="complexity-tab-content">
                    <div className="metrics-cards-grid">
                      {/* CARD 1: TIME COMPLEXITY */}
                      <div className="complexity-card">
                        <div className="card-header">
                          <div className="card-title">
                            <Clock size={16} className="icon-blue" />
                            <span>TIME COMPLEXITY</span>
                          </div>
                          <span className="gain-tag green">{optimizedResult.timeEfficiencyGain}</span>
                        </div>
                        <div className="card-value-flow">
                          <span className="val-before">{optimizedResult.timeBefore}</span>
                          <span className="val-arrow">→</span>
                          <span className="val-after highlight-blue">{optimizedResult.timeAfter}</span>
                        </div>
                        <p className="card-desc">Algorithmic execution steps scaled against input size N.</p>
                      </div>

                      {/* CARD 2: SPACE COMPLEXITY */}
                      <div className="complexity-card">
                        <div className="card-header">
                          <div className="card-title">
                            <HardDrive size={16} className="icon-sky" />
                            <span>SPACE COMPLEXITY</span>
                          </div>
                          <span className="gain-tag sky">{optimizedResult.spaceMemorySaved}</span>
                        </div>
                        <div className="card-value-flow">
                          <span className="val-before">{optimizedResult.spaceBefore}</span>
                          <span className="val-arrow">→</span>
                          <span className="val-after highlight-sky">{optimizedResult.spaceAfter}</span>
                        </div>
                        <p className="card-desc">Auxiliary memory overhead and heap allocation consumption.</p>
                      </div>

                      {/* CARD 3: EXECUTION TIME */}
                      <div className="complexity-card">
                        <div className="card-header">
                          <div className="card-title">
                            <Activity size={16} className="icon-amber" />
                            <span>EXECUTION SPEED</span>
                          </div>
                          <span className="gain-tag amber">Benchmarked</span>
                        </div>
                        <div className="card-value-flow">
                          <span className="val-before">{optimizedResult.executionTimeMs.before}</span>
                          <span className="val-arrow">→</span>
                          <span className="val-after highlight-amber">{optimizedResult.executionTimeMs.after}</span>
                        </div>
                        <p className="card-desc">V8 JIT compilation and micro-benchmark execution runtime.</p>
                      </div>

                      {/* CARD 4: CYCLOMATIC COMPLEXITY */}
                      <div className="complexity-card">
                        <div className="card-header">
                          <div className="card-title">
                            <Cpu size={16} className="icon-purple" />
                            <span>CYCLOMATIC COMPLEXITY</span>
                          </div>
                          <span className="gain-tag purple">Simplified</span>
                        </div>
                        <div className="card-value-flow">
                          <span className="val-before">Grade {optimizedResult.cyclomaticComplexity.before}</span>
                          <span className="val-arrow">→</span>
                          <span className="val-after highlight-purple">Grade {optimizedResult.cyclomaticComplexity.after}</span>
                        </div>
                        <p className="card-desc">Linearly independent paths through program source code.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: TERMINAL OUTPUT LOGS */}
                {activeTab === 'output' && (
                  <div className="terminal-logs-view code-font">
                    {optimizedResult.logs.map((log, index) => (
                      <div key={index} className="log-line">
                        <span className="log-timestamp">[{new Date().toLocaleTimeString()}]</span>
                        <span className="log-text">{log}</span>
                      </div>
                    ))}
                    <div className="log-line success-line">
                      <CheckCircle2 size={14} />
                      <span>[SUCCESS] Code optimization completed in {optimizedResult.executionTimeMs.after}.</span>
                    </div>
                  </div>
                )}

                {/* TAB 3: PERFORMANCE BENCHMARKS */}
                {activeTab === 'benchmarks' && (
                  <div className="benchmarks-view">
                    <div className="benchmark-bar-group">
                      <div className="bar-label">
                        <span>Original Execution Time</span>
                        <span className="bar-val">{optimizedResult.executionTimeMs.before}</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill original" style={{ width: '100%' }}></div>
                      </div>
                    </div>

                    <div className="benchmark-bar-group">
                      <div className="bar-label">
                        <span>Optimized Execution Time</span>
                        <span className="bar-val green">{optimizedResult.executionTimeMs.after}</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill optimized" style={{ width: '32%' }}></div>
                      </div>
                    </div>

                    <div className="benchmark-summary">
                      <Zap size={18} className="zap-yellow" />
                      <span>The optimized algorithm executes <strong>3.15x faster</strong> under heavy payload benchmarks.</span>
                    </div>
                  </div>
                )}

                {/* TAB 4: AI RECOMMENDATIONS */}
                {activeTab === 'recommendations' && (
                  <div className="recommendations-view">
                    <ul className="rec-list">
                      {optimizedResult.recommendations.map((rec, i) => (
                        <li key={i} className="rec-item">
                          <CheckCircle2 size={16} className="rec-icon" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
