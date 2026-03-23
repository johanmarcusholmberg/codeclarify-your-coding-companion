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
      el.style.height = Math.max(200, el.scrollHeight) + "px";
    }
  }, [value]);

  const lineCount = (value || placeholder || "").split("\n").length;

  return (
    <div className="relative rounded-xl border border-border bg-code-bg overflow-hidden surface-elevated">
      <div className="flex">
        {/* Line numbers */}
        <div
          className="select-none py-4 pl-4 pr-3 text-right font-mono text-xs leading-[1.625rem] text-code-line border-r border-border/50"
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
          className="flex-1 resize-none bg-transparent py-4 px-4 font-mono text-sm leading-[1.625rem] text-code-foreground placeholder:text-code-line/60 focus:outline-none min-h-[200px] overflow-hidden"
        />
      </div>
    </div>
  );
};

export default CodeInput;
