import React, { useState, useEffect, useRef } from 'react';
import { LanguageSelectorProps } from '../types/components';
import { formatLanguageName } from '../utils/languageUtils';
import './LanguageSelector.css';

/**
 * LanguageSelector component
 * 构建参数化语言选择器(LanguageSelector)等标准化 UI 控件，通过 Props 驱动实现跨功能模块的组件复用
 * A parameterized dropdown component for selecting languages
 * Supports multilingual display and search functionality with full Props-driven configuration
 */
const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  value,
  onChange,
  languages,
  label,
  disabled = false,
  displayOptions = { showNativeName: true, showEnglishName: true, groupByRegion: false, showOnlySupported: false },
  className = '',
  placeholder = '选择语言...',
  error,
  required = false,
  testId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLanguages, setFilteredLanguages] = useState(languages);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get the currently selected language
  const selectedLanguage = languages.find(lang => lang.code === value);

  // Filter languages based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredLanguages(languages);
      return;
    }

    const filtered = languages.filter(lang =>
      lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredLanguages(filtered);
  }, [searchTerm, languages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle language selection
  const handleSelectLanguage = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Format language display based on options
  const getLanguageDisplay = (lang: typeof languages[0]) => {
    const { showNativeName, showEnglishName } = displayOptions;

    if (showNativeName && showEnglishName) {
      return formatLanguageName(lang, true);
    } else if (showNativeName) {
      return lang.nativeName;
    } else {
      return lang.name;
    }
  };

  return (
    <div
      className={`language-selector ${className}`}
      ref={dropdownRef}
      data-testid={testId}
    >
      {label && (
        <label htmlFor={`language-select-${label.replace(/\s+/g, '-').toLowerCase()}`}>
          {label}{required && <span className="required-mark">*</span>}
        </label>
      )}

      <div className={`language-select-container ${error ? 'has-error' : ''}`}>
        <button
          type="button"
          id={`language-select-${label?.replace(/\s+/g, '-').toLowerCase()}`}
          className="language-select-button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label ? `language-select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined}
        >
          {selectedLanguage ? (
            <span className="selected-language">
              {getLanguageDisplay(selectedLanguage)}
              {selectedLanguage.direction === 'rtl' && <span className="rtl-indicator">RTL</span>}
            </span>
          ) : (
            <span className="placeholder">{placeholder}</span>
          )}
          <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
        </button>

        {isOpen && (
          <div className="language-dropdown">
            <div className="search-container">
              <input
                ref={searchInputRef}
                type="text"
                className="language-search"
                placeholder="搜索语言..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {filteredLanguages.length > 0 ? (
              <ul className="language-list" role="listbox">
                {filteredLanguages.map((lang) => (
                  <li
                    key={lang.code}
                    className={`language-item ${lang.code === value ? 'selected' : ''} ${lang.direction === 'rtl' ? 'rtl' : ''}`}
                    onClick={() => handleSelectLanguage(lang.code)}
                    role="option"
                    aria-selected={lang.code === value}
                  >
                    <span className="language-name">{getLanguageDisplay(lang)}</span>
                    <span className="language-code">{lang.code}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-results">没有找到匹配的语言</div>
            )}
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default LanguageSelector;