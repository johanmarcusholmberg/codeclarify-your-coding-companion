import { useRef, useEffect, useCallback } from "react";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const CodeInput = ({ value, onChange, placeholder }: CodeInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumRef = useRef<HTMLDivElement>(null);

  // Sync heights: textarea auto-sizes, line numbers scroll with it
  const syncHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    // Reset then measure
    el.style.height = "0px";
    const scrollH = el.scrollHeight;
    // Cap at ~50 rows (50 * 1.625rem line-height ≈ 1300px)
    const maxH = 50 * 26; // 26px per row at 1.625rem
    const h = Math.max(140, Math.min(scrollH, maxH));
    el.style.height = h + "px";
  }, []);

  useEffect(() => {
    syncHeight();
  }, [value, syncHeight]);

  // Sync scroll between textarea and line numbers
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumRef.current) {
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const displayValue = value || "";
  const lines = displayValue.split("\n");
  const lineCount = Math.max(lines.length, 1);

  return (
    <div className="relative rounded-xl border border-border bg-code-bg overflow-hidden surface-elevated focus-within:ring-2 focus-within:ring-sage/20 focus-within:border-sage-medium/60 transition-all duration-200">
      <div className="flex items-stretch">
        {/* Line numbers — scrolls in sync with textarea */}
        <div
          ref={lineNumRef}
          className="select-none py-3 pl-3 sm:pl-4 pr-2 sm:pr-3 text-right font-mono text-[11px] sm:text-xs leading-[1.625rem] text-code-line border-r border-border/50 overflow-hidden shrink-0"
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="h-[1.625rem] flex items-center justify-end">
              {i + 1}
            </div>
          ))}
        </div>
        {/* Editor */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          placeholder={placeholder}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          data-gramm="false"
          className="flex-1 resize-none bg-transparent py-3 px-3 sm:px-4 font-mono text-[12px] sm:text-sm leading-[1.625rem] text-code-foreground placeholder:text-code-line/40 focus:outline-none overflow-y-auto"
          style={{ minHeight: 140, maxHeight: 50 * 26 }}
        />
      </div>
    </div>
  );
};

export default CodeInput;
