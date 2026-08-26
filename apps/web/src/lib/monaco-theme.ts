import type { Monaco } from '@monaco-editor/react';

export function installBugHunterTheme(monaco: Monaco): void {
  monaco.editor.defineTheme('bughunter-terminal', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5c6a5e', fontStyle: 'italic' },
      { token: 'keyword', foreground: '48ff9b' },
      { token: 'string', foreground: 'ffb454' },
      { token: 'number', foreground: '8cffbc' },
      { token: 'type', foreground: 'd9a05e' },
      { token: 'identifier', foreground: 'f2f5f2' },
      { token: 'delimiter', foreground: '8b978b' },
      { token: 'operator', foreground: '48ff9b' },
      { token: 'function', foreground: 'eafff2' },
    ],
    colors: {
      'editor.background': '#050805',
      'editor.foreground': '#f2f5f2',
      'editor.lineHighlightBackground': '#0d130e',
      'editor.lineHighlightBorder': '#00000000',
      'editor.selectionBackground': '#27c46b40',
      'editor.inactiveSelectionBackground': '#27c46b22',
      'editorCursor.foreground': '#48ff9b',
      'editorLineNumber.foreground': '#39453a',
      'editorLineNumber.activeForeground': '#48ff9b',
      'editorIndentGuide.background': '#1d231d',
      'editorIndentGuide.activeBackground': '#2a332a',
      'editorGutter.background': '#050805',
      'editorWidget.background': '#0d110d',
      'editorWidget.border': '#2a332a',
      'editorSuggestWidget.background': '#0d110d',
      'editorSuggestWidget.border': '#2a332a',
      'editorSuggestWidget.selectedBackground': '#07271a',
      'scrollbarSlider.background': '#1d231d80',
      'scrollbarSlider.hoverBackground': '#2a332aa0',
      'scrollbarSlider.activeBackground': '#39453a',
      'minimap.background': '#050805',
      'editorBracketMatch.border': '#48ff9b80',
      'editorBracketMatch.background': '#07271a',
    },
  });
}
