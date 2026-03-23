import { useMemo } from "react";
import { useHighlight } from "@/contexts/HighlightContext";
import type { LineRange } from "@/lib/explanationEngine";

interface CodeViewerProps {
  code: string;
}

function isLineHighlighted(line: number, range: LineRange | null): boolean {
  if (!range) return false;
  return line >= range.start && line <= range.end;
}

const CodeViewer = ({ code }: CodeViewerProps) => {
  const { activeLines, highlightFromCode, clearHighlight } = useHighlight();

  const lines = useMemo(() => code.split("\n"), [code]);

  return (
    <div className="rounded-xl border border-border bg-code-bg overflow-hidden surface-elevated font-mono text-sm leading-[1.625rem]">
      <div className="px-4 py-2.5 border-b border-border/50 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-border" />
          <span className="w-2.5 h-2.5 rounded-full bg-border" />
          <span className="w-2.5 h-2.5 rounded-full bg-border" />
        </div>
        <span className="text-xs text-muted-foreground ml-2">Source code</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const highlighted = isLineHighlighted(lineNum, activeLines);
              return (
                <tr
                  key={lineNum}
                  className={`group cursor-pointer transition-colors duration-150 ${
                    highlighted
                      ? "bg-code-highlight"
                      : "hover:bg-muted/40"
                  }`}
                  onMouseEnter={() => highlightFromCode(lineNum)}
                  onMouseLeave={clearHighlight}
                  role="row"
                  aria-label={`Line ${lineNum}`}
                >
                  <td
                    className={`select-none text-right pr-3 pl-4 py-0 w-10 text-xs transition-colors duration-150 ${
                      highlighted
                        ? "text-sage font-medium"
                        : "text-code-line"
                    }`}
                    aria-hidden="true"
                  >
                    {lineNum}
                  </td>
                  <td className="pr-4 py-0 whitespace-pre text-code-foreground">
                    {line || "\u00A0"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CodeViewer;
