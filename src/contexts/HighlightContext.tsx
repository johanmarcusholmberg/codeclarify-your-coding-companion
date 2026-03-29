import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { LineRange, ExplanationItemId, MappingConfidence, ExplanationItem } from "@/lib/explanationEngine";

interface HighlightState {
  /** Currently highlighted lines in the code viewer */
  activeLines: LineRange | null;
  /** Currently highlighted explanation item */
  activeItemId: ExplanationItemId | null;
  /** Which side initiated the highlight: "code" or "explanation" */
  source: "code" | "explanation" | null;
  /** Mapping confidence for the current highlight */
  confidence: MappingConfidence;
  /** Whether the current highlight is pinned (click vs hover) */
  pinned: boolean;
}

interface HighlightContextValue extends HighlightState {
  highlightFromExplanation: (
    itemId: ExplanationItemId,
    lines: LineRange | undefined,
    confidence?: MappingConfidence
  ) => void;
  highlightFromCode: (line: number) => void;
  clearHighlight: () => void;
  pinHighlight: (
    itemId: ExplanationItemId,
    lines: LineRange | undefined,
    confidence?: MappingConfidence
  ) => void;
}

const HighlightContext = createContext<HighlightContextValue | null>(null);

export function useHighlight() {
  const ctx = useContext(HighlightContext);
  if (!ctx)
    throw new Error("useHighlight must be used inside HighlightProvider");
  return ctx;
}

interface HighlightProviderProps {
  children: ReactNode;
  /** Map from line number → explanation item IDs that reference it */
  lineToItems?: Map<number, ExplanationItemId[]>;
}

const INITIAL: HighlightState = {
  activeLines: null,
  activeItemId: null,
  source: null,
  confidence: "exact",
  pinned: false,
};

export function HighlightProvider({
  children,
  lineToItems,
}: HighlightProviderProps) {
  const [state, setState] = useState<HighlightState>(INITIAL);

  const highlightFromExplanation = useCallback(
    (itemId: ExplanationItemId, lines: LineRange | undefined, confidence: MappingConfidence = "exact") => {
      setState((prev) => {
        // Don't override a pinned state with hover
        if (prev.pinned) return prev;
        return {
          activeLines: lines ?? null,
          activeItemId: itemId,
          source: "explanation",
          confidence: lines ? confidence : "unmapped",
          pinned: false,
        };
      });
    },
    []
  );

  const highlightFromCode = useCallback(
    (line: number) => {
      setState((prev) => {
        if (prev.pinned) return prev;
        if (!lineToItems) {
          return { activeLines: { start: line, end: line }, activeItemId: null, source: "code", confidence: "exact", pinned: false };
        }
        const ids = lineToItems.get(line);
        const firstId = ids?.[0] ?? null;
        return {
          activeLines: { start: line, end: line },
          activeItemId: firstId,
          source: "code",
          confidence: "exact",
          pinned: false,
        };
      });
    },
    [lineToItems]
  );

  const clearHighlight = useCallback(() => {
    setState((prev) => {
      if (prev.pinned) return prev;
      return INITIAL;
    });
  }, []);

  const pinHighlight = useCallback(
    (itemId: ExplanationItemId, lines: LineRange | undefined, confidence: MappingConfidence = "exact") => {
      setState((prev) => {
        // Toggle off if same item is already pinned
        if (prev.pinned && prev.activeItemId === itemId) {
          return INITIAL;
        }
        return {
          activeLines: lines ?? null,
          activeItemId: itemId,
          source: "explanation",
          confidence: lines ? confidence : "unmapped",
          pinned: true,
        };
      });
    },
    []
  );

  return (
    <HighlightContext.Provider
      value={{
        ...state,
        highlightFromExplanation,
        highlightFromCode,
        clearHighlight,
        pinHighlight,
      }}
    >
      {children}
    </HighlightContext.Provider>
  );
}
