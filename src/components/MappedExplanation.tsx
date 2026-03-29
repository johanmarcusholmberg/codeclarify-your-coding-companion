import { useMemo } from "react";
import CodeViewer from "@/components/CodeViewer";
import ExplanationPanel from "@/components/ExplanationPanel";
import { HighlightProvider } from "@/contexts/HighlightContext";
import type { CodeExplanation, ExplanationItemId } from "@/lib/explanationEngine";
import { makeItemId } from "@/lib/explanationEngine";

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

const MappedExplanation = ({ code, data, isLoading }: MappedExplanationProps) => {
  const lineToItems = useMemo(
    () => (data ? buildLineToItemsMap(data) : undefined),
    [data]
  );

  const hasResults = !!data || isLoading;

  return (
    <HighlightProvider lineToItems={lineToItems}>
      {hasResults ? (
        <div className="space-y-3 animate-fade-up">
          {/* Helper guidance */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/60">
            <Info className="w-3 h-3" />
            <span>Hover or click explanation cards to see how they connect to the code</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
            {/* Left: Code viewer (sticky on desktop) */}
            <div className="lg:sticky lg:top-20">
              <CodeViewer code={code} />
            </div>

            {/* Right: Explanation panel */}
            <div>
              <ExplanationPanel data={data} isLoading={isLoading} />
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
