import { useMemo, useState } from "react";
import { Info, BookOpen, Play } from "lucide-react";
import CodeViewer from "@/components/CodeViewer";
import ExplanationPanel from "@/components/ExplanationPanel";
import GuidedMode from "@/components/GuidedMode";
import { HighlightProvider } from "@/contexts/HighlightContext";
import type { CodeExplanation, ExplanationItemId } from "@/lib/explanationEngine";
import { makeItemId } from "@/lib/explanationEngine";

type ViewMode = "categorized" | "guided";

interface MappedExplanationProps {
  code: string;
  data: CodeExplanation | null;
  isLoading?: boolean;
}

const SECTION_KEYS = [
  "structure",
  "functions",
  "variables",
  "logic",
  "syntax",
  "suggestions",
] as const;

function buildLineToItemsMap(data: CodeExplanation): Map<number, ExplanationItemId[]> {
  const map = new Map<number, ExplanationItemId[]>();

  const addToMap = (line: number, id: ExplanationItemId) => {
    const existing = map.get(line);
    if (existing) existing.push(id);
    else map.set(line, [id]);
  };

  const addRange = (lines: { start: number; end: number } | undefined, id: ExplanationItemId) => {
    if (!lines) return;
    for (let l = lines.start; l <= lines.end; l++) addToMap(l, id);
  };

  for (const key of SECTION_KEYS) {
    data[key].forEach((item, idx) => addRange(item.lines, makeItemId(key, idx)));
  }

  data.relationships.forEach((rel, idx) => {
    const id = makeItemId("relationships", idx);
    addRange(rel.fromLines, id);
    addRange(rel.toLines, id);
  });

  data.dataFlow.forEach((step, idx) => addRange(step.lines, makeItemId("dataFlow", idx)));
  data.contextSuggestions.forEach((s, idx) => addRange(s.lines, makeItemId("contextSuggestions", idx)));

  return map;
}

// ---------------------------------------------------------------------------
// View mode toggle — consistent sizing on all screens
// ---------------------------------------------------------------------------

const ViewModeToggle = ({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) => (
  <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5 gap-0.5 shrink-0">
    <button
      onClick={() => onChange("categorized")}
      className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-md transition-all duration-200 ${
        mode === "categorized"
          ? "bg-sage text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
      Browse
    </button>
    <button
      onClick={() => onChange("guided")}
      className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-md transition-all duration-200 ${
        mode === "guided"
          ? "bg-sage text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
      Follow along
    </button>
  </div>
);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const MappedExplanation = ({ code, data, isLoading }: MappedExplanationProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("categorized");

  const lineToItems = useMemo(
    () => (data ? buildLineToItemsMap(data) : undefined),
    [data]
  );

  const hasResults = !!data || isLoading;

  return (
    <HighlightProvider lineToItems={lineToItems}>
      {hasResults ? (
        <div className="space-y-3 animate-fade-up">
          {/* Top bar: view toggle + contextual hint */}
          <div className="flex items-center justify-between gap-2 flex-wrap-reverse">
            {data && !isLoading && (
              <ViewModeToggle mode={viewMode} onChange={setViewMode} />
            )}
            <p className="text-[10px] sm:text-[11px] text-muted-foreground/50 flex items-center gap-1">
              <Info className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">
                {viewMode === "guided"
                  ? "Step through the code one piece at a time — use arrow keys or buttons"
                  : "Hover or click explanation cards to see connected code"}
              </span>
              <span className="sm:hidden">
                {viewMode === "guided"
                  ? "Tap Next to walk through the code"
                  : "Tap a card to highlight its code"}
              </span>
            </p>
          </div>

          {/* Two-panel layout — stacked on mobile, side-by-side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5 items-start">
            {/* Code viewer — collapsible on mobile when guided mode */}
            <div className="lg:sticky lg:top-20">
              <CodeViewer code={code} />
            </div>

            {/* Explanation / Guided */}
            <div>
              {viewMode === "guided" && data && !isLoading ? (
                <GuidedMode data={data} />
              ) : (
                <ExplanationPanel data={data} isLoading={isLoading} />
              )}
            </div>
          </div>
        </div>
      ) : (
        <ExplanationPanel data={null} isLoading={false} />
      )}
    </HighlightProvider>
  );
};

export default MappedExplanation;
