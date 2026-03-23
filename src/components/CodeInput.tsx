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
      el.style.height = Math.max(180, el.scrollHeight) + "px";
    }
  }, [value]);

  const lineCount = (value || placeholder || "").split("\n").length;

  return (
    <div className="relative rounded-xl border border-border bg-code-bg overflow-hidden surface-elevated focus-within:ring-2 focus-within:ring-sage/20 focus-within:border-sage-medium/60 transition-all duration-200">
      <div className="flex">
        {/* Line numbers */}
        <div
          className="select-none py-3 sm:py-4 pl-3 sm:pl-4 pr-2 sm:pr-3 text-right font-mono text-xs leading-[1.625rem] text-code-line border-r border-border/50"
          aria-hidden="true"
        >
          {Array.from({ length: Math.max(lineCount, 8) }, (_, i) => (
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
          className="flex-1 resize-none bg-transparent py-3 sm:py-4 px-3 sm:px-4 font-mono text-[13px] sm:text-sm leading-[1.625rem] text-code-foreground placeholder:text-code-line/50 focus:outline-none min-h-[180px] overflow-hidden"
        />
      </div>
    </div>
  );
};

export default CodeInput;
