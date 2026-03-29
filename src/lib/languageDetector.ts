/**
 * Simple heuristic-based language detection for pasted code snippets.
 * Returns the most likely language key matching LanguageSelector values.
 */

interface LangPattern {
  lang: string;
  patterns: RegExp[];
  weight: number;
}

const LANG_PATTERNS: LangPattern[] = [
  {
    lang: "typescript",
    patterns: [
      /\binterface\s+\w+\s*\{/,
      /:\s*(string|number|boolean|void|any|never)\b/,
      /\btype\s+\w+\s*=/,
      /\bas\s+(string|number|boolean|any)\b/,
      /<\w+(\s*,\s*\w+)*>/,
      /\benum\s+\w+/,
    ],
    weight: 3,
  },
  {
    lang: "javascript",
    patterns: [
      /\bconst\s+\w+\s*=/,
      /\blet\s+\w+\s*=/,
      /\bfunction\s+\w+\s*\(/,
      /=>\s*[{(]/,
      /\bconsole\.(log|error|warn)\b/,
      /\bdocument\.\w+/,
      /\brequire\s*\(/,
      /\bmodule\.exports\b/,
      /\bimport\s+.*\s+from\s+['"]/,
    ],
    weight: 1,
  },
  {
    lang: "python",
    patterns: [
      /\bdef\s+\w+\s*\(/,
      /\bimport\s+\w+/,
      /\bfrom\s+\w+\s+import\b/,
      /\bclass\s+\w+.*:/,
      /\bprint\s*\(/,
      /\bif\s+.*:\s*$/m,
      /\bfor\s+\w+\s+in\s+/,
      /\belif\b/,
      /\b__\w+__\b/,
      /"""[\s\S]*?"""/,
    ],
    weight: 2,
  },
  {
    lang: "html",
    patterns: [
      /<(!DOCTYPE|html|head|body|div|span|p|a|img|section|header|footer|nav|ul|li|h[1-6])\b/i,
      /<\/\w+>/,
      /\bclass="[^"]*"/,
      /\bhref="[^"]*"/,
    ],
    weight: 2,
  },
  {
    lang: "css",
    patterns: [
      /\{[\s\S]*?(display|flex|grid|padding|margin|background|color|font-size|border-radius)\s*:/,
      /\.\w+\s*\{/,
      /#\w+\s*\{/,
      /@media\s/,
      /@keyframes\s/,
      /:\s*hover\s*\{/,
    ],
    weight: 2,
  },
  {
    lang: "sql",
    patterns: [
      /\bSELECT\b/i,
      /\bFROM\b/i,
      /\bWHERE\b/i,
      /\bINSERT\s+INTO\b/i,
      /\bCREATE\s+TABLE\b/i,
      /\bJOIN\b/i,
      /\bGROUP\s+BY\b/i,
      /\bORDER\s+BY\b/i,
    ],
    weight: 2,
  },
  {
    lang: "java",
    patterns: [
      /\bpublic\s+(static\s+)?(void|int|String|class)\b/,
      /\bSystem\.out\.println\b/,
      /\bprivate\s+\w+/,
      /\bnew\s+\w+\s*\(/,
      /\bimport\s+java\./,
    ],
    weight: 2,
  },
  {
    lang: "csharp",
    patterns: [
      /\busing\s+System/,
      /\bnamespace\s+\w+/,
      /\bpublic\s+class\b/,
      /\bConsole\.Write(Line)?\b/,
      /\bstring\b.*\bget;\s*set;\b/,
      /\$"[^"]*\{/,
      /\bvar\s+\w+\s*=/,
    ],
    weight: 2,
  },
];

export function detectLanguage(code: string): string | null {
  if (!code || code.trim().length < 10) return null;

  const scores: Record<string, number> = {};

  for (const { lang, patterns, weight } of LANG_PATTERNS) {
    let matched = 0;
    for (const pat of patterns) {
      if (pat.test(code)) matched++;
    }
    if (matched > 0) {
      scores[lang] = matched * weight;
    }
  }

  // TypeScript is a superset of JS — if both match, TS needs extra signals
  if (scores.typescript && scores.javascript) {
    // Only pick TS if it has strong unique signals
    if (scores.typescript < 3) {
      delete scores.typescript;
    }
  }

  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  // Only suggest if the top score is meaningful
  const [topLang, topScore] = entries[0];
  if (topScore < 2) return null;

  return topLang;
}

/**
 * Normalize pasted code: trim leading and trailing blank lines,
 * preserve meaningful internal spacing and indentation.
 */
export function normalizeCode(code: string): string {
  // Remove leading blank lines
  let result = code.replace(/^\s*\n/, "");
  // Remove trailing blank lines
  result = result.replace(/\n\s*$/g, "");
  return result;
}
