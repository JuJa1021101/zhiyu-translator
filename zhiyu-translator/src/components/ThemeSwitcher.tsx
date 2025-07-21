import React, { useEffect } from 'react';
import './ThemeSwitcher.css';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeSwitcherProps {
  /** Current theme */
  theme: Theme;
  /** Callback when theme changes */
  onThemeChange: (theme: Theme) => void;
}

/**
 * Component for switching between light, dark, and system themes
 */
const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, onThemeChange }) => {
  // Apply theme to document when it changes
  useEffect(() => {
    const applyTheme = (themeName: Theme) => {
      // If theme is system, detect system preference
      if (themeName === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', themeName);
      }
    };

    applyTheme(theme);

    // Listen for system theme changes if using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = () => {
        applyTheme('system');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <div className="theme-switcher">
      <div className="theme-options">
        <button
          className={`theme-option ${theme === 'light' ? 'active' : ''}`}
          onClick={() => onThemeChange('light')}
          aria-label="使用浅色主题"
          title="浅色主题"
        >
          <span className="theme-icon">☀️</span>
        </button>

        <button
          className={`theme-option ${theme === 'system' ? 'active' : ''}`}
          onClick={() => onThemeChange('system')}
          aria-label="使用系统主题"
          title="系统主题"
        >
          <span className="theme-icon">⚙️</span>
        </button>

        <button
          className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => onThemeChange('dark')}
          aria-label="使用深色主题"
          title="深色主题"
        >
          <span className="theme-icon">🌙</span>
        </button>
      </div>
    </div>
  );
};

export default ThemeSwitcher;