import { useMemo } from "react";
import { useHighlight } from "@/contexts/HighlightContext";
import type { LineRange, MappingConfidence } from "@/lib/explanationEngine";
import { MousePointerClick } from "lucide-react";

interface CodeViewerProps {
  code: string;
}

function isLineHighlighted(line: number, range: LineRange | null): boolean {
  if (!range) return false;
  return line >= range.start && line <= range.end;
}

function getLineClasses(
  highlighted: boolean,
  pinned: boolean,
  confidence: MappingConfidence
): { row: string; num: string } {
  if (!highlighted) {
    return {
      row: "hover:bg-muted/40",
      num: "text-code-line",
    };
  }

  if (pinned) {
    // Pinned states — stronger visual
    if (confidence === "exact") return { row: "bg-code-highlight ring-1 ring-inset ring-sage-medium/50", num: "text-sage font-semibold" };
    if (confidence === "likely") return { row: "bg-code-highlight/80 ring-1 ring-inset ring-sage-medium/30", num: "text-sage font-medium" };
    if (confidence === "broad") return { row: "bg-code-highlight/50 ring-1 ring-inset ring-dashed ring-sage-medium/20", num: "text-sage/70 font-medium" };
    return { row: "bg-muted/30", num: "text-code-line" };
  }

  // Hover states — softer visual
  if (confidence === "exact") return { row: "bg-code-highlight", num: "text-sage font-medium" };
  if (confidence === "likely") return { row: "bg-code-highlight/70", num: "text-sage/80 font-medium" };
  if (confidence === "broad") return { row: "bg-code-highlight/40", num: "text-sage/60" };
  return { row: "bg-muted/20", num: "text-code-line" };
}

const CodeViewer = ({ code }: CodeViewerProps) => {
  const { activeLines, confidence, pinned, highlightFromCode, clearHighlight } = useHighlight();

  const lines = useMemo(() => code.split("\n"), [code]);

  return (
    <div className="rounded-xl border border-border bg-code-bg overflow-hidden surface-elevated font-mono text-sm leading-[1.625rem]">
      <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
          </div>
          <span className="text-xs text-muted-foreground ml-2">Source code</span>
        </div>
        <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
          <MousePointerClick className="w-3 h-3" />
          Hover or click explanations to connect
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const highlighted = isLineHighlighted(lineNum, activeLines);
              const classes = getLineClasses(highlighted, pinned, confidence);
              return (
                <tr
                  key={lineNum}
                  className={`group cursor-pointer transition-all duration-150 ${classes.row}`}
                  onMouseEnter={() => highlightFromCode(lineNum)}
                  onMouseLeave={clearHighlight}
                  role="row"
                  aria-label={`Line ${lineNum}`}
                >
                  <td
                    className={`select-none text-right pr-3 pl-4 py-0 w-10 text-xs transition-colors duration-150 ${classes.num}`}
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
