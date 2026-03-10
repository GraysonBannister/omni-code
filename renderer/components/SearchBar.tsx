import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, FileText, FileCode } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import './SearchBar.css';

interface SearchResult {
  path: string;
  name: string;
  lineNumber?: number;
  preview?: string;
  isContentMatch: boolean;
}

export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { files, projectPath, openFile } = useAppStore();

  const isContentSearch = query.startsWith('%');
  const searchTerm = isContentSearch ? query.slice(1).trim() : query.trim();

  // Filter files by name for default search
  const fileNameResults = useMemo(() => {
    if (!searchTerm || isContentSearch) return [];

    const lowerTerm = searchTerm.toLowerCase();
    return files
      .filter(f => !f.isDirectory && f.name.toLowerCase().includes(lowerTerm))
      .map(f => ({
        path: f.path,
        name: f.name,
        isContentMatch: false,
      }))
      .slice(0, 50); // Limit to 50 results
  }, [files, searchTerm, isContentSearch]);

  // Perform content search when query starts with '%'
  useEffect(() => {
    if (!isContentSearch || !searchTerm || !projectPath) {
      if (!isContentSearch) {
        setResults(fileNameResults);
      }
      return;
    }

    const performContentSearch = async () => {
      setIsLoading(true);
      try {
        const response = await window.electronAPI?.file.searchContent(projectPath, searchTerm);
        if (response?.results) {
          setResults(response.results.map(r => ({
            path: r.path,
            name: r.path.split('/').pop() || r.path,
            lineNumber: r.lineNumber,
            preview: r.preview,
            isContentMatch: true,
          })));
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Content search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(performContentSearch, 150);
    return () => clearTimeout(timeoutId);
  }, [isContentSearch, searchTerm, projectPath, fileNameResults]);

  // Update results when file name search changes
  useEffect(() => {
    if (!isContentSearch) {
      setResults(fileNameResults);
    }
  }, [fileNameResults, isContentSearch]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMetaOrCtrl = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+P to focus search
      if (isMetaOrCtrl && e.key === 'p') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }

      // Only handle these if search is open
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          setIsOpen(false);
          inputRef.current?.blur();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % results.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((result: SearchResult) => {
    openFile(result.path);
    setIsOpen(false);
    setQuery('');
    inputRef.current?.blur();
  }, [openFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const getPlaceholder = () => {
    if (isContentSearch) {
      return 'Search file contents...';
    }
    return 'Search files (type % for content search)';
  };

  return (
    <div ref={containerRef} className="search-bar-container">
      <div className="search-bar-input-wrapper">
        <Search size={14} className="search-bar-icon" />
        <input
          ref={inputRef}
          type="text"
          className="search-bar-input"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={getPlaceholder()}
        />
        {isContentSearch && (
          <span className="search-bar-mode">Content</span>
        )}
        <span className="search-bar-shortcut">⌘P</span>
      </div>

      {isOpen && query.trim() && (
        <div className="search-bar-dropdown">
          {isLoading ? (
            <div className="search-bar-loading">Searching...</div>
          ) : results.length === 0 ? (
            <div className="search-bar-no-results">No results found</div>
          ) : (
            <>
              <div className="search-bar-results-count">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              <div className="search-bar-results-list">
                {results.map((result, index) => (
                  <div
                    key={`${result.path}-${result.lineNumber || 0}`}
                    className={`search-bar-result ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="search-bar-result-icon">
                      {result.isContentMatch ? <FileText size={14} /> : <FileCode size={14} />}
                    </div>
                    <div className="search-bar-result-content">
                      <div className="search-bar-result-name">
                        {result.name}
                      </div>
                      <div className="search-bar-result-path">
                        {result.path}
                        {result.lineNumber !== undefined && (
                          <span className="search-bar-result-line">:{result.lineNumber}</span>
                        )}
                      </div>
                      {result.preview && (
                        <div className="search-bar-result-preview">
                          {result.preview}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
