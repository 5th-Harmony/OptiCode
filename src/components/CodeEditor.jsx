import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  onApplyOptimization
}) {
  const [copiedSource, setCopiedSource] = useState(false);
  const [copiedOptimized, setCopiedOptimized] = useState(false);

  // Refs for scroll-sync between code content and line-number gutter
  const sourceLineNumRef    = useRef(null);
  const sourceTextareaRef   = useRef(null);
  const optimizedLineNumRef = useRef(null);
  const optimizedPreRef     = useRef(null);

  // Reset scroll position to top when active file changes
  useEffect(() => {
    if (sourceTextareaRef.current)   sourceTextareaRef.current.scrollTop   = 0;
    if (sourceLineNumRef.current)    sourceLineNumRef.current.scrollTop     = 0;
    if (optimizedPreRef.current)     optimizedPreRef.current.scrollTop      = 0;
    if (optimizedLineNumRef.current) optimizedLineNumRef.current.scrollTop  = 0;
  }, [activeFile?.id]);

  // Smooth synchronized scroll: textarea ↔ line-number gutter (source pane)
  const handleSourceScroll = useCallback((e) => {
    const top = e.currentTarget.scrollTop;
    if (sourceLineNumRef.current) {
      sourceLineNumRef.current.scrollTop = top;
    }
  }, []);

  // Smooth synchronized scroll: pre ↔ line-number gutter (optimized pane)
  const handleOptimizedScroll = useCallback((e) => {
    const top = e.currentTarget.scrollTop;
    if (optimizedLineNumRef.current) {
      optimizedLineNumRef.current.scrollTop = top;
    }
  }, []);

  const handleCopySource = () => {
    if (!activeFile) return;
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
    if (!optimizedResult || !activeFile) return;
    const element = document.createElement('a');
    const blob = new Blob([optimizedResult.optimizedCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(blob);
    element.download = `optimized_${activeFile.name}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  if (!activeFile) {
    return (
      <div className="editor-empty">
        <Code size={48} className="empty-icon" />
        <p>No file selected. Choose or create a file from the explorer.</p>
      </div>
    );
  }

  // Line number arrays — minimum 25 lines shown even for short files
  const sourceLines  = activeFile.content.split('\n');
  const sourceCount  = Math.max(sourceLines.length, 25);
  const sourceNums   = Array.from({ length: sourceCount }, (_, i) => i + 1);

  const optimizedLines = optimizedResult ? optimizedResult.optimizedCode.split('\n') : [];
  const optimizedCount = Math.max(optimizedLines.length, 25);
  const optimizedNums  = Array.from({ length: optimizedCount }, (_, i) => i + 1);

  return (
    <div className="dual-editor-container">

      {/* ── LEFT PANE: SOURCE CODE ───────────────────────────────────────── */}
      <div className="editor-pane source-pane">
        <div className="pane-header">
          <div className="pane-breadcrumb">
            <span className="pane-label">SOURCE CODE</span>
            <button
              className={`btn-glowing-red ${isOptimizing ? 'loading' : ''}`}
              onClick={onOptimize}
              disabled={isOptimizing}
              title={`Optimize ${activeFile.name} with OptiCode AI`}
              id="btn-editor-optimize"
            >
              {isOptimizing ? (
                <>
                  <span className="spinner-icon-red"></span>
                  <span>Analyzing...</span>
                </>
              ) : (
                <span>Optimize Code</span>
              )}
            </button>
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

        {/* Editor body: line gutter + scrollable textarea side by side */}
        <div className="editor-body">
          {/* Line-number gutter — scroll-locked to textarea via scrollTop sync */}
          <div className="line-numbers" ref={sourceLineNumRef} aria-hidden="true">
            {sourceNums.map(n => (
              <div key={n} className="line-num">{n}</div>
            ))}
          </div>

          <textarea
            ref={sourceTextareaRef}
            className="code-textarea code-font"
            style={{
              fontSize: 'var(--editor-font-size, 14px)',
              tabSize: 'var(--editor-tab-size, 2)'
            }}
            value={activeFile.content}
            onChange={(e) => onUpdateContent(activeFile.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                const target = e.target;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                const tabSpaces = '  '; // 2 spaces
                const newContent = activeFile.content.substring(0, start) + tabSpaces + activeFile.content.substring(end);
                onUpdateContent(activeFile.id, newContent);
                setTimeout(() => {
                  target.selectionStart = target.selectionEnd = start + tabSpaces.length;
                }, 0);
              }
            }}
            onScroll={handleSourceScroll}
            placeholder="Type or paste code here..."
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
      </div>

      {/* ── DIVIDER ─────────────────────────────────────────────────────── */}
      <div className="pane-divider" role="separator" />

      {/* ── RIGHT PANE: OPTIMIZED CODE ──────────────────────────────────── */}
      <div className="editor-pane optimized-pane">
        <div className="pane-header">
          <div className="pane-breadcrumb">
            <span className="pane-label">OPTIMIZED CODE</span>
            {optimizedResult && (
              <span className="badge badge-success">
                {optimizedResult.timeEfficiencyGain}
              </span>
            )}
            {!optimizedResult && !isOptimizing && (
              <span className="breadcrumb-path" style={{ fontSize: '0.72rem' }}>
                — {activeFile.name} (not yet optimized)
              </span>
            )}
          </div>

          <div className="pane-actions">
            {optimizedResult && (
              <>
                <button
                  className="action-btn"
                  onClick={onApplyOptimization}
                  title="Replace Source with Optimized Code"
                >
                  <CheckCircle2 size={14} className="success-icon" />
                </button>
                <button
                  className="action-btn"
                  onClick={handleDownloadOptimized}
                  title={`Download optimized_${activeFile.name}`}
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
            /* AI analyzing loading state */
            <div className="optimizing-loading-state">
              <div className="ai-pulse-orb">
                <Zap size={32} className="pulse-zap" />
              </div>
              <h3>OptiCode AI Engine Active</h3>
              <p>Scanning cyclomatic complexity, memory allocations &amp; loop structures for <strong>{activeFile.name}</strong>...</p>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" />
              </div>
            </div>
          ) : !optimizedResult ? (
            /* Per-file placeholder — shows filename to reinforce per-file context */
            <div className="editor-placeholder-state">
              <div className="placeholder-icon-box">
                <ArrowRightLeft size={24} />
              </div>
              <p className="placeholder-text">Ready for optimization</p>
              <span className="placeholder-subtext">
                Click <strong>Optimize Code</strong> above to analyze <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-tertiary)', padding: '1px 6px', borderRadius: 4 }}>{activeFile.name}</code>
              </span>
            </div>
          ) : (
            /* Optimized code display with synchronized scroll */
            <div className="optimized-code-view">
              <div className="line-numbers" ref={optimizedLineNumRef} aria-hidden="true">
                {optimizedNums.map(n => (
                  <div key={n} className="line-num">{n}</div>
                ))}
              </div>

              <pre
                ref={optimizedPreRef}
                className="code-pre code-font"
                style={{
                  fontSize: 'var(--editor-font-size, 14px)',
                  tabSize: 'var(--editor-tab-size, 2)'
                }}
                onScroll={handleOptimizedScroll}
              >
                <code>{optimizedResult.optimizedCode}</code>
              </pre>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
