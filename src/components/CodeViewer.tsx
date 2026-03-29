import { useMemo, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { X, Info } from "lucide-react";
import { useHighlight } from "@/contexts/HighlightContext";
import type { LineRange, MappingConfidence, ExplanationItemId, CodeExplanation } from "@/lib/explanationEngine";
import { makeItemId } from "@/lib/explanationEngine";

export interface CodeViewerHandle {
  scrollToLine: (line: number) => void;
}

interface CodeViewerProps {
  code: string;
  /** Pass explanation data so clicking a line can show what it does */
  explanationData?: CodeExplanation | null;
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

const SECTION_KEYS = ["structure", "functions", "variables", "logic", "syntax", "suggestions"] as const;

interface LineInfo {
  label: string;
  detail: string;
  section: string;
}

/** Build a map from line number to the best (most specific) explanation item for that line */
function buildLineInfoMap(data: CodeExplanation): Map<number, LineInfo & { rangeSize: number; lines: LineRange }> {
  const map = new Map<number, LineInfo & { rangeSize: number; lines: LineRange }>();

  const sectionLabels: Record<string, string> = {
    structure: "Structure",
    functions: "Function",
    variables: "Variable",
    logic: "Logic",
    syntax: "Syntax",
    suggestions: "Suggestion",
  };

  for (const key of SECTION_KEYS) {
    for (const item of data[key]) {
      if (!item.lines) continue;
      const rangeSize = item.lines.end - item.lines.start;
      for (let l = item.lines.start; l <= item.lines.end; l++) {
        const existing = map.get(l);
        // Prefer more specific (smaller range) items
        if (!existing || rangeSize < existing.rangeSize) {
          map.set(l, { label: item.label, detail: item.detail, section: sectionLabels[key] || key, rangeSize, lines: item.lines });
        }
      }
    }
  }

  return map;
}

const CodeViewer = forwardRef<CodeViewerHandle, CodeViewerProps>(({ code, explanationData }, ref) => {
  const { activeLines, confidence, pinned, highlightFromCode, clearHighlight } = useHighlight();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [clickedLine, setClickedLine] = useState<number | null>(null);

  const lines = useMemo(() => code.split("\n"), [code]);

  const lineInfoMap = useMemo(
    () => (explanationData ? buildLineInfoMap(explanationData) : new Map<number, LineInfo>()),
    [explanationData]
  );

  const clickedInfo = clickedLine ? lineInfoMap.get(clickedLine) : null;

  const handleLineClick = useCallback((lineNum: number) => {
    setClickedLine((prev) => (prev === lineNum ? null : lineNum));
  }, []);

  const dismissTooltip = useCallback(() => setClickedLine(null), []);

  useImperativeHandle(ref, () => ({
    scrollToLine(line: number) {
      const container = scrollContainerRef.current;
      if (!container) return;
      container.scrollLeft = 0;
      const firstRow = container.querySelector("tr");
      const rowHeight = firstRow ? firstRow.getBoundingClientRect().height : 26;
      const targetY = (line - 1) * rowHeight;
      const containerHeight = container.clientHeight;
      const scrollTo = Math.max(0, targetY - containerHeight * 0.25);
      container.scrollTo({ top: scrollTo, left: 0, behavior: "smooth" });
    },
  }));

  return (
    <div className="rounded-xl border border-border bg-code-bg overflow-hidden surface-elevated font-mono text-sm leading-[1.625rem]">
      {/* Header */}
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
          Click a line to see what it does
        </span>
      </div>

      {/* Inline tooltip for clicked line */}
      {clickedLine !== null && (
        <div className="px-3 sm:px-4 py-2 border-b border-sage-medium/30 bg-sage-light/40 animate-fade-up">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-sage mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0 font-sans">
              {clickedInfo ? (
                <>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-medium text-sage bg-sage/10 px-1.5 py-0.5 rounded">
                      {clickedInfo.section}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Line {clickedLine}</span>
                  </div>
                  <p className="text-xs font-medium text-foreground">{clickedInfo.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-3">{clickedInfo.detail}</p>
                </>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  No specific explanation for line {clickedLine}. Try clicking a line with code on it.
                </p>
              )}
            </div>
            <button
              onClick={dismissTooltip}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-muted/60 transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Code lines */}
      <div ref={scrollContainerRef} className="overflow-x-auto max-h-[50vh] sm:max-h-[65vh] overflow-y-auto">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const highlighted = isLineHighlighted(lineNum, activeLines) || lineNum === clickedLine;
              const isClicked = lineNum === clickedLine;
              const classes = getLineClasses(
                highlighted,
                pinned || isClicked,
                isClicked ? "exact" : confidence
              );
              return (
                <tr
                  key={lineNum}
                  className={`group cursor-pointer transition-colors duration-100 ${classes.row}`}
                  onMouseEnter={() => highlightFromCode(lineNum)}
                  onMouseLeave={clearHighlight}
                  onClick={() => handleLineClick(lineNum)}
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

      {/* Mobile hint */}
      <div className="sm:hidden border-t border-border/40 px-3 py-2 bg-muted/20">
        <p className="text-[10px] text-muted-foreground/50 text-center">
          Tap a line to see what it does
        </p>
      </div>
    </div>
  );
});

CodeViewer.displayName = "CodeViewer";

export default CodeViewer;
