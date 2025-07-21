import React from 'react';
import { KeyboardShortcut, formatKeyboardShortcut } from '../utils/keyboardUtils';
import './KeyboardShortcutsHelp.css';

interface KeyboardShortcutsHelpProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog is closed */
  onClose: () => void;
  /** List of keyboard shortcuts */
  shortcuts: KeyboardShortcut[];
}

/**
 * Component for displaying keyboard shortcuts help
 */
const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose,
  shortcuts
}) => {
  if (!isOpen) return null;

  // Filter out disabled shortcuts
  const activeShortcuts = shortcuts.filter(shortcut => shortcut.enabled !== false);

  return (
    <div className="keyboard-shortcuts-overlay" onClick={onClose}>
      <div className="keyboard-shortcuts-dialog" onClick={e => e.stopPropagation()}>
        <div className="keyboard-shortcuts-header">
          <h2>键盘快捷键</h2>
          <button className="close-button" onClick={onClose} aria-label="关闭">×</button>
        </div>

        <div className="keyboard-shortcuts-content">
          {activeShortcuts.length === 0 ? (
            <p className="no-shortcuts">没有可用的快捷键</p>
          ) : (
            <table className="shortcuts-table">
              <thead>
                <tr>
                  <th>快捷键</th>
                  <th>功能</th>
                </tr>
              </thead>
              <tbody>
                {activeShortcuts.map((shortcut, index) => (
                  <tr key={index}>
                    <td className="shortcut-key">
                      <kbd>{formatKeyboardShortcut(shortcut.key)}</kbd>
                    </td>
                    <td className="shortcut-description">{shortcut.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="keyboard-shortcuts-footer">
          <button className="close-button-text" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;