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

const SECTION_KEYS: (keyof Omit<CodeExplanation, "summary" | "beginnerMode" | "summaryLines">)[] = [
  "structure",
  "functions",
  "variables",
  "logic",
  "syntax",
  "suggestions",
];

/**
 * Build a reverse map: line number → list of explanation item IDs that reference it.
 * Used for code→explanation highlighting.
 */
function buildLineToItemsMap(data: CodeExplanation): Map<number, ExplanationItemId[]> {
  const map = new Map<number, ExplanationItemId[]>();

  for (const key of SECTION_KEYS) {
    const items = data[key];
    items.forEach((item, idx) => {
      if (!item.lines) return;
      const id = makeItemId(key, idx);
      for (let l = item.lines.start; l <= item.lines.end; l++) {
        const existing = map.get(l);
        if (existing) {
          existing.push(id);
        } else {
          map.set(l, [id]);
        }
      }
    });
  }

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start animate-fade-up">
          {/* Left: Code viewer (sticky on desktop) */}
          <div className="lg:sticky lg:top-20">
            <CodeViewer code={code} />
          </div>

          {/* Right: Explanation panel */}
          <div>
            <ExplanationPanel data={data} isLoading={isLoading} />
          </div>
        </div>
      ) : (
        <ExplanationPanel data={null} isLoading={false} />
      )}
    </HighlightProvider>
  );
};

export default MappedExplanation;
