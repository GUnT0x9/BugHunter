import type { Monaco } from '@monaco-editor/react';

export function installBugHunterTheme(monaco: Monaco): void {
  monaco.editor.defineTheme('bughunter-terminal', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5a625c', fontStyle: 'italic' },
      { token: 'keyword', foreground: '56b8d8' },
      { token: 'string', foreground: 'd4a64e' },
      { token: 'number', foreground: '3ecf8e' },
      { token: 'type', foreground: 'd9a05e' },
      { token: 'identifier', foreground: 'd7ded9' },
      { token: 'delimiter', foreground: '8b948e' },
      { token: 'operator', foreground: '56b8d8' },
      { token: 'function', foreground: '56b8d8' },
    ],
    colors: {
      'editor.background': '#101310',
      'editor.foreground': '#d7ded9',
      'editor.lineHighlightBackground': '#151915',
      'editor.selectionBackground': '#2ea86f40',
      'editor.inactiveSelectionBackground': '#2ea86f22',
      'editorCursor.foreground': '#3ecf8e',
      'editorLineNumber.foreground': '#3a403b',
      'editorLineNumber.activeForeground': '#3ecf8e',
      'editorIndentGuide.background': '#232823',
      'editorIndentGuide.activeBackground': '#30362f',
      'editorGutter.background': '#0e110f',
      'editorWidget.background': '#151915',
      'editorWidget.border': '#30362f',
      'editorSuggestWidget.background': '#151915',
      'editorSuggestWidget.border': '#30362f',
      'editorSuggestWidget.selectedBackground': '#0f2b1e',
      'scrollbarSlider.background': '#23282380',
      'scrollbarSlider.hoverBackground': '#30362fa0',
      'scrollbarSlider.activeBackground': '#3a403b',
      'minimap.background': '#101310',
    },
  });
}