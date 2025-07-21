import { Language, LanguageDisplayOptions, ErrorSeverity, TranslationError } from './index';

// Language selector component props
export interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
  languages: Language[];
  label: string;
  disabled?: boolean;
  displayOptions?: LanguageDisplayOptions;
  className?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  testId?: string;
}

// Progress indicator component props
export interface ProgressIndicatorProps {
  progress: number;
  message: string;
  isVisible: boolean;
  variant?: 'linear' | 'circular';
  className?: string;
  showPercentage?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  testId?: string;
}

// Translation input component props
export interface TranslationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  className?: string;
  label?: string;
  error?: string;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  testId?: string;
  debounceTime?: number; // Time in ms to debounce input changes
}

// Translation output component props
export interface TranslationOutputProps {
  value: string;
  isLoading?: boolean;
  onCopy?: () => void;
  className?: string;
  showCopyButton?: boolean;
  label?: string;
  testId?: string;
}

// Error display component props
export interface ErrorDisplayProps {
  error: TranslationError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  severity?: ErrorSeverity;
  className?: string;
  testId?: string;
}

// Model info display component props
export interface ModelInfoProps {
  modelName: string;
  isLoading: boolean;
  progress: number;
  size?: string;
  className?: string;
  testId?: string;
}

// Translation controls component props
export interface TranslationControlsProps {
  onTranslate: () => void;
  onSwapLanguages: () => void;
  onClearText: () => void;
  isTranslating: boolean;
  hasText: boolean;
  className?: string;
  disabled?: boolean;
  testId?: string;
}

// Settings panel component props
export interface SettingsPanelProps {
  onSettingsChange: (settings: any) => void;
  settings: any;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  testId?: string;
}

// Layout component props
export interface LayoutProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  testId?: string;
}