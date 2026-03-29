import { useMemo, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { useHighlight } from "@/contexts/HighlightContext";
import type { LineRange, MappingConfidence } from "@/lib/explanationEngine";

export interface CodeViewerHandle {
  scrollToLine: (line: number) => void;
}

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
      row: "hover:bg-muted/30",
      num: "text-code-line",
    };
  }

  if (pinned) {
    if (confidence === "exact") return { row: "bg-code-highlight ring-1 ring-inset ring-sage-medium/50", num: "text-sage font-semibold" };
    if (confidence === "likely") return { row: "bg-code-highlight/80 ring-1 ring-inset ring-sage-medium/30", num: "text-sage font-medium" };
    if (confidence === "broad") return { row: "bg-code-highlight/40 border-l-2 border-l-sage-medium/30", num: "text-sage/60 font-medium" };
    return { row: "bg-muted/20", num: "text-code-line" };
  }

  if (confidence === "exact") return { row: "bg-code-highlight", num: "text-sage font-medium" };
  if (confidence === "likely") return { row: "bg-code-highlight/60", num: "text-sage/70" };
  if (confidence === "broad") return { row: "bg-code-highlight/30", num: "text-sage/50" };
  return { row: "bg-muted/15", num: "text-code-line" };
}

const CodeViewer = forwardRef<CodeViewerHandle, CodeViewerProps>(({ code }, ref) => {
  const { activeLines, confidence, pinned, highlightFromCode, clearHighlight } = useHighlight();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => {
    // Normalize: strip leading/trailing blank lines for clean display
    const trimmed = code.replace(/^\s*\n/, "").replace(/\n\s*$/g, "");
    return trimmed.split("\n");
  }, [code]);

  useImperativeHandle(ref, () => ({
    scrollToLine(line: number) {
      const container = scrollContainerRef.current;
      if (!container) return;
      // Reset horizontal scroll
      container.scrollLeft = 0;
      // Measure actual row height from DOM if possible
      const firstRow = container.querySelector("tr");
      const rowHeight = firstRow ? firstRow.getBoundingClientRect().height : 26;
      const targetY = (line - 1) * rowHeight;
      const containerHeight = container.clientHeight;
      // Place the target line ~25% from top so it's clearly visible
      const scrollTo = Math.max(0, targetY - containerHeight * 0.25);
      container.scrollTo({ top: scrollTo, left: 0, behavior: "smooth" });
    },
  }));

  return (
    <div className="rounded-xl border border-border bg-code-bg overflow-hidden surface-elevated font-mono text-sm leading-[1.625rem]">
      {/* Header — not sticky, sits above scrollable area */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-border/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-border" />
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-border" />
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-border" />
          </div>
          <span className="text-[11px] sm:text-xs text-muted-foreground ml-1 sm:ml-2">Source code</span>
        </div>
        <span className="text-[9px] sm:text-[10px] text-muted-foreground/40 hidden sm:flex items-center gap-1">
          Click an explanation card to highlight its code
        </span>
      </div>

      {/* Code lines — header is outside scroll area so it never covers code */}
      <div ref={scrollContainerRef} className="overflow-x-auto max-h-[50vh] sm:max-h-[65vh] overflow-y-auto">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const highlighted = isLineHighlighted(lineNum, activeLines);
              const classes = getLineClasses(highlighted, pinned, confidence);
              return (
                <tr
                  key={lineNum}
                  className={`group cursor-pointer transition-colors duration-100 ${classes.row}`}
                  onMouseEnter={() => highlightFromCode(lineNum)}
                  onMouseLeave={clearHighlight}
                  role="row"
                  aria-label={`Line ${lineNum}`}
                >
                  <td
                    className={`select-none text-right pr-2 sm:pr-3 pl-3 sm:pl-4 py-0 w-8 sm:w-10 text-[11px] sm:text-xs transition-colors duration-100 ${classes.num}`}
                    aria-hidden="true"
                  >
                    {lineNum}
                  </td>
                  <td className="pr-3 sm:pr-4 py-0 whitespace-pre text-code-foreground text-[13px] sm:text-sm">
                    {line || "\u00A0"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile hint — only on small screens */}
      <div className="sm:hidden border-t border-border/40 px-3 py-2 bg-muted/20">
        <p className="text-[10px] text-muted-foreground/50 text-center">
          Tap an explanation below to highlight related code
        </p>
      </div>
    </div>
  );
});

CodeViewer.displayName = "CodeViewer";

export default CodeViewer;
