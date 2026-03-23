import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { LineRange, ExplanationItemId } from "@/lib/explanationEngine";

interface HighlightState {
  /** Currently highlighted lines in the code viewer */
  activeLines: LineRange | null;
  /** Currently highlighted explanation item */
  activeItemId: ExplanationItemId | null;
  /** Which side initiated the highlight: "code" or "explanation" */
  source: "code" | "explanation" | null;
}

interface HighlightContextValue extends HighlightState {
  highlightFromExplanation: (
    itemId: ExplanationItemId,
    lines: LineRange | undefined
  ) => void;
  highlightFromCode: (line: number) => void;
  clearHighlight: () => void;
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

export function HighlightProvider({
  children,
  lineToItems,
}: HighlightProviderProps) {
  const [state, setState] = useState<HighlightState>({
    activeLines: null,
    activeItemId: null,
    source: null,
  });

  const highlightFromExplanation = useCallback(
    (itemId: ExplanationItemId, lines: LineRange | undefined) => {
      setState({
        activeLines: lines ?? null,
        activeItemId: itemId,
        source: "explanation",
      });
    },
    []
  );

  const highlightFromCode = useCallback(
    (line: number) => {
      if (!lineToItems) {
        setState({ activeLines: { start: line, end: line }, activeItemId: null, source: "code" });
        return;
      }
      const ids = lineToItems.get(line);
      const firstId = ids?.[0] ?? null;
      setState({
        activeLines: { start: line, end: line },
        activeItemId: firstId,
        source: "code",
      });
    },
    [lineToItems]
  );

  const clearHighlight = useCallback(() => {
    setState({ activeLines: null, activeItemId: null, source: null });
  }, []);

  return (
    <HighlightContext.Provider
      value={{
        ...state,
        highlightFromExplanation,
        highlightFromCode,
        clearHighlight,
      }}
    >
      {children}
    </HighlightContext.Provider>
  );
}
