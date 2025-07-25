/**
 * Component prop types and interfaces
 */

import { Language } from './languages';

// Base component props
export interface BaseComponentProps {
  className?: string;
  testId?: string;
}

// Language Selector Props
export interface LanguageSelectorProps extends BaseComponentProps {
  value: string;
  onChange: (language: string) => void;
  languages: Language[];
  label?: string;
  disabled?: boolean;
  placeholder?: string;
}

// Translation Input Props
export interface TranslationInputProps extends BaseComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  label?: string;
  error?: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  debounceTime?: number;
}

// Translation Output Props
export interface TranslationOutputProps extends BaseComponentProps {
  value: string;
  isLoading?: boolean;
  onCopy?: () => void;
  label?: string;
  showCopyButton?: boolean;
}

// Theme Switcher Props
export interface ThemeSwitcherProps extends BaseComponentProps {
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

// Error Notification Props
export interface ErrorNotificationProps extends BaseComponentProps {
  error: Error;
  onDismiss: () => void;
  onRetry?: () => void;
  autoHideDuration?: number;
}

// Keyboard Shortcuts Help Props
export interface KeyboardShortcutsHelpProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: Array<{
    key: string;
    description: string;
    enabled: boolean;
  }>;
}