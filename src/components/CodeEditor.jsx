import React, { useState } from 'react';
import { 
  Copy, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Zap, 
  Code, 
  Download, 
  CheckCircle2,
  ArrowRightLeft
} from 'lucide-react';

export default function CodeEditor({
  activeFile,
  onUpdateContent,
  onOptimize,
  optimizedResult,
  isOptimizing,
  onApplyOptimization,
  isTerminalOpen
}) {
  const [copiedSource, setCopiedSource] = useState(false);
  const [copiedOptimized, setCopiedOptimized] = useState(false);

  if (!activeFile) {
    return (
      <div className="editor-empty">
        <Code size={48} className="empty-icon" />
        <p>No file selected. Choose or create a file from the explorer.</p>
      </div>
    );
  }

  const lines = activeFile.content.split('\n');
  const lineCount = Math.max(lines.length, 15);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const optimizedLines = optimizedResult ? optimizedResult.optimizedCode.split('\n') : [];
  const optimizedLineCount = Math.max(optimizedLines.length, 15);
  const optimizedLineNumbers = Array.from({ length: optimizedLineCount }, (_, i) => i + 1);

  const handleCopySource = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopiedSource(true);
    setTimeout(() => setCopiedSource(false), 2000);
  };

  const handleCopyOptimized = () => {
    if (optimizedResult) {
      navigator.clipboard.writeText(optimizedResult.optimizedCode);
      setCopiedOptimized(true);
      setTimeout(() => setCopiedOptimized(false), 2000);
    }
  };

  const handleDownloadOptimized = () => {
    if (!optimizedResult) return;
    const element = document.createElement('a');
    const file = new Blob([optimizedResult.optimizedCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `optimized_${activeFile.name}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="dual-editor-container">
      {/* LEFT PANE: SOURCE CODE */}
      <div className="editor-pane source-pane">
        <div className="pane-header">
          <div className="pane-breadcrumb">
            <span className="pane-label">SOURCE CODE</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-path">{activeFile.path}</span>
          </div>

          <div className="pane-actions">
            <button 
              className="action-btn" 
              onClick={handleCopySource}
              title="Copy Source Code"
            >
              {copiedSource ? <Check size={14} className="success-icon" /> : <Copy size={14} />}
            </button>
            <button 
              className="action-btn" 
              onClick={() => onUpdateContent(activeFile.id, '')}
              title="Clear Editor"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        <div className="editor-body">
          <div className="line-numbers">
            {lineNumbers.map(num => (
              <div key={num} className="line-num">{num}</div>
            ))}
          </div>

          <textarea
            className="code-textarea code-font"
            value={activeFile.content}
            onChange={(e) => onUpdateContent(activeFile.id, e.target.value)}
            placeholder="Type or paste code here..."
            spellCheck="false"
          />
        </div>

        {/* FLOATING OPTIMIZE BUTTON: Moves dynamically when terminal drawer is opened, NO emojis */}
        <div className={`floating-optimize-container ${isTerminalOpen ? 'terminal-shifted' : ''}`}>
          <button 
            className={`btn-optimize ${isOptimizing ? 'loading' : ''}`}
            onClick={onOptimize}
            disabled={isOptimizing}
          >
            {isOptimizing ? (
              <>
                <div className="spinner-icon"></div>
                <span>Analyzing AST...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} className="sparkle-glow" />
                <span>Optimize Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* DIVIDER RESIZER BAR */}
      <div className="pane-divider"></div>

      {/* RIGHT PANE: OPTIMIZED CODE */}
      <div className="editor-pane optimized-pane">
        <div className="pane-header">
          <div className="pane-breadcrumb">
            <span className="pane-label">OPTIMIZED CODE</span>
            {optimizedResult && (
              <span className="badge badge-success">
                {optimizedResult.timeEfficiencyGain}
              </span>
            )}
          </div>

          <div className="pane-actions">
            {optimizedResult && (
              <>
                <button 
                  className="action-btn" 
                  onClick={onApplyOptimization}
                  title="Apply Optimized Code to Source"
                >
                  <CheckCircle2 size={14} className="success-icon" />
                </button>
                <button 
                  className="action-btn" 
                  onClick={handleDownloadOptimized}
                  title="Download File"
                >
                  <Download size={14} />
                </button>
                <button 
                  className="action-btn" 
                  onClick={handleCopyOptimized}
                  title="Copy Optimized Code"
                >
                  {copiedOptimized ? <Check size={14} className="success-icon" /> : <Copy size={14} />}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="editor-body">
          {isOptimizing ? (
            <div className="optimizing-loading-state">
              <div className="ai-pulse-orb">
                <Zap size={32} className="pulse-zap" />
              </div>
              <h3>OptiCode AI Engine Active</h3>
              <p>Scanning cyclomatic complexity, memory allocations & loop structures...</p>
              <div className="progress-bar-container">
                <div className="progress-bar-fill"></div>
              </div>
            </div>
          ) : !optimizedResult ? (
            /* INITIAL STATE */
            <div className="editor-placeholder-state">
              <div className="placeholder-icon-box">
                <ArrowRightLeft size={24} />
              </div>
              <p className="placeholder-text">Ready for optimization</p>
              <span className="placeholder-subtext">Click "Optimize Code" below to transform algorithm complexity</span>
            </div>
          ) : (
            /* COMPLETED OPTIMIZED CODE DISPLAY */
            <div className="optimized-code-view">
              <div className="line-numbers">
                {optimizedLineNumbers.map(num => (
                  <div key={num} className="line-num">{num}</div>
                ))}
              </div>

              <pre className="code-pre code-font">
                <code>{optimizedResult.optimizedCode}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
