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

type ItemSectionKey = typeof SECTION_KEYS[number];

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
// View mode toggle
// ---------------------------------------------------------------------------

const ViewModeToggle = ({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) => (
  <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5 gap-0.5">
    <button
      onClick={() => onChange("categorized")}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-200 ${
        mode === "categorized"
          ? "bg-sage text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      <BookOpen className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Categorized</span>
      <span className="sm:hidden">Browse</span>
    </button>
    <button
      onClick={() => onChange("guided")}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-200 ${
        mode === "guided"
          ? "bg-sage text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      <Play className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Follow along</span>
      <span className="sm:hidden">Guide</span>
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
          {/* Top bar: helper hint + view toggle */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              <Info className="w-3 h-3" />
              <span>
                {viewMode === "guided"
                  ? "Step through the code one piece at a time"
                  : "Hover or click explanation cards to connect to the code"}
              </span>
            </div>
            {data && !isLoading && (
              <ViewModeToggle mode={viewMode} onChange={setViewMode} />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
            {/* Left: Code viewer (sticky on desktop) */}
            <div className="lg:sticky lg:top-20">
              <CodeViewer code={code} />
            </div>

            {/* Right: Explanation or Guided */}
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
