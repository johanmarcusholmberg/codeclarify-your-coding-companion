import { useRef, useEffect } from "react";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const CodeInput = ({ value, onChange, placeholder }: CodeInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.max(160, Math.min(el.scrollHeight, 400)) + "px";
    }
  }, [value]);

  const lineCount = (value || placeholder || "").split("\n").length;

  return (
    <div className="relative rounded-xl border border-border bg-code-bg overflow-hidden surface-elevated focus-within:ring-2 focus-within:ring-sage/20 focus-within:border-sage-medium/60 transition-all duration-200">
      <div className="flex">
        {/* Line numbers */}
        <div
          className="select-none py-3 pl-2.5 sm:pl-4 pr-1.5 sm:pr-3 text-right font-mono text-[11px] sm:text-xs leading-[1.625rem] text-code-line border-r border-border/50"
          aria-hidden="true"
        >
          {Array.from({ length: Math.max(lineCount, 6) }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        {/* Editor */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          className="flex-1 resize-none bg-transparent py-3 px-2.5 sm:px-4 font-mono text-[12px] sm:text-sm leading-[1.625rem] text-code-foreground placeholder:text-code-line/40 focus:outline-none min-h-[160px] max-h-[400px] overflow-y-auto"
        />
      </div>
    </div>
  );
};

export default CodeInput;
