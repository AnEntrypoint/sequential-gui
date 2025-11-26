import React from 'react';

const SyntaxHighlighter = ({ code, language }) => {
  const getHighlightedCode = () => {
    if (!language) return code;

    const tokens = {
      javascript: {
        keywords: ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'for', 'while', 'try', 'catch', 'throw', 'new', 'class', 'import', 'export', 'from', 'default', 'switch', 'case', 'break', 'continue'],
        builtins: ['console', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Promise', 'Date', 'Math', 'RegExp'],
        methods: ['log', 'error', 'warn', 'parse', 'stringify', 'map', 'filter', 'reduce', 'forEach', 'push', 'pop', 'shift', 'unshift', 'slice', 'splice'],
        operators: ['===', '!==', '==', '!=', '<=', '>=', '<', '>', '&&', '||', '!', '+', '-', '*', '/', '%', '=']
      },
      json: {},
      markdown: {},
      python: {
        keywords: ['def', 'class', 'import', 'from', 'as', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'async', 'await', 'lambda', 'yield'],
        builtins: ['print', 'len', 'range', 'list', 'dict', 'str', 'int', 'float', 'bool', 'True', 'False', 'None']
      }
    };

    const langTokens = tokens[language] || tokens.javascript;

    let highlighted = code;

    // Strings
    highlighted = highlighted.replace(
      /(['"`])(?:(?=(\\?))\2.)*?\1/g,
      '<span class="syntax-string">$&</span>'
    );

    // Comments
    if (language === 'javascript' || language === 'python') {
      highlighted = highlighted.replace(
        /\/\/.*/g,
        '<span class="syntax-comment">$&</span>'
      );
      highlighted = highlighted.replace(
        /\/\*[\s\S]*?\*\//g,
        '<span class="syntax-comment">$&</span>'
      );
    }

    if (language === 'python') {
      highlighted = highlighted.replace(
        /#.*/g,
        '<span class="syntax-comment">$&</span>'
      );
    }

    // Numbers
    highlighted = highlighted.replace(
      /\b(\d+\.?\d*)\b/g,
      '<span class="syntax-number">$&</span>'
    );

    // Keywords
    if (langTokens.keywords) {
      langTokens.keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        highlighted = highlighted.replace(
          regex,
          `<span class="syntax-keyword">${keyword}</span>`
        );
      });
    }

    // Built-ins
    if (langTokens.builtins) {
      langTokens.builtins.forEach(builtin => {
        const regex = new RegExp(`\\b${builtin}\\b`, 'g');
        highlighted = highlighted.replace(
          regex,
          `<span class="syntax-builtin">${builtin}</span>`
        );
      });
    }

    // Functions
    highlighted = highlighted.replace(
      /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
      '<span class="syntax-function">$1</span>('
    );

    return highlighted;
  };

  const getLanguageFromFilename = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    const langMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'javascript',
      tsx: 'javascript',
      json: 'json',
      md: 'markdown',
      py: 'python',
      txt: 'text',
      log: 'text'
    };
    return langMap[ext] || 'text';
  };

  const detectedLanguage = language || getLanguageFromFilename(code);

  if (detectedLanguage === 'json') {
    try {
      const formatted = JSON.stringify(JSON.parse(code), null, 2);
      return (
        <pre style={styles.pre}>
          <code style={styles.code} dangerouslySetInnerHTML={{ __html: formatJSON(formatted) }} />
        </pre>
      );
    } catch {
      return (
        <pre style={styles.pre}>
          <code style={styles.code}>{code}</code>
        </pre>
      );
    }
  }

  if (detectedLanguage === 'markdown') {
    return (
      <pre style={styles.pre}>
        <code style={styles.code} dangerouslySetInnerHTML={{ __html: formatMarkdown(code) }} />
      </pre>
    );
  }

  if (detectedLanguage === 'text') {
    return (
      <pre style={styles.pre}>
        <code style={styles.code}>{code}</code>
      </pre>
    );
  }

  return (
    <pre style={styles.pre}>
      <code style={styles.code} dangerouslySetInnerHTML={{ __html: getHighlightedCode() }} />
    </pre>
  );
};

const formatJSON = (json) => {
  return json
    .replace(/"([^"]+)":/g, '<span class="syntax-json-key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="syntax-string">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="syntax-number">$1</span>')
    .replace(/: (true|false|null)/g, ': <span class="syntax-keyword">$1</span>');
};

const formatMarkdown = (md) => {
  return md
    .replace(/^(#{1,6})\s+(.+)$/gm, '<span class="syntax-md-header">$&</span>')
    .replace(/\*\*(.+?)\*\*/g, '<span class="syntax-md-bold">**$1**</span>')
    .replace(/\*(.+?)\*/g, '<span class="syntax-md-italic">*$1*</span>')
    .replace(/`(.+?)`/g, '<span class="syntax-md-code">`$1`</span>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="syntax-md-link">[$1]($2)</span>');
};

const styles = {
  pre: {
    margin: 0,
    padding: '20px',
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    fontSize: '13px',
    fontFamily: 'monospace',
    overflowX: 'auto',
    lineHeight: '1.6'
  },
  code: {
    fontFamily: 'inherit'
  }
};

export default SyntaxHighlighter;
