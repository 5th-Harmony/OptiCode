import React, { useState } from 'react';
import { Search, Replace, ChevronRight, FileCode } from 'lucide-react';

export default function SearchPanel({ files, onSelectFile }) {
  const [query, setQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const matches = query.trim() ? files.map(file => {
    const lines = file.content.split('\n');
    const matchedLines = [];
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(query.toLowerCase())) {
        matchedLines.push({ lineNumber: idx + 1, content: line });
      }
    });
    return { file, matches: matchedLines };
  }).filter(group => group.matches.length > 0) : [];

  return (
    <div className="search-panel">
      <div className="search-header">
        <span className="search-title">SEARCH & REPLACE</span>
      </div>

      <div className="search-inputs">
        <div className="search-field">
          <Search size={15} className="input-icon" />
          <input
            type="text"
            placeholder="Search (e.g. processData, for, items)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="search-field">
          <Replace size={15} className="input-icon" />
          <input
            type="text"
            placeholder="Replace with"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="search-results">
        {query.trim() === '' ? (
          <div className="search-placeholder">Type a search term to find occurrences across workspace files.</div>
        ) : matches.length === 0 ? (
          <div className="search-placeholder">No results found for "{query}".</div>
        ) : (
          <div className="results-list">
            <div className="results-count">
              Found {matches.reduce((acc, curr) => acc + curr.matches.length, 0)} results across {matches.length} files
            </div>

            {matches.map(({ file, matches: lineMatches }) => (
              <div key={file.id} className="file-result-group">
                <div 
                  className="result-file-header"
                  onClick={() => onSelectFile(file.id)}
                >
                  <ChevronRight size={14} />
                  <FileCode size={14} style={{ color: '#3B82F6' }} />
                  <span className="result-file-name">{file.name}</span>
                  <span className="match-badge">{lineMatches.length}</span>
                </div>

                <div className="result-lines">
                  {lineMatches.map((match, i) => (
                    <div 
                      key={i} 
                      className="line-match-item"
                      onClick={() => onSelectFile(file.id)}
                    >
                      <span className="line-num">{match.lineNumber}:</span>
                      <span className="line-text">{match.content.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
