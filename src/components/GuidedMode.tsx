import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  Lightbulb,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import type { CodeExplanation, LineRange, MappingConfidence } from "@/lib/explanationEngine";
import { makeItemId } from "@/lib/explanationEngine";
import { useHighlight } from "@/contexts/HighlightContext";

// ---------------------------------------------------------------------------
// Build guided steps from explanation data — sorted by line number
// ---------------------------------------------------------------------------

interface GuidedStep {
  title: string;
  detail: string;
  lines?: LineRange;
  confidence: MappingConfidence;
  sectionKey: string;
  itemIndex: number;
  stepType: string;
}

function buildGuidedSteps(data: CodeExplanation): GuidedStep[] {
  const steps: GuidedStep[] = [];

  const sources: { key: string; label: string; items: { label: string; detail: string; lines?: LineRange; confidence?: MappingConfidence }[] }[] = [
    { key: "structure", label: "Structure", items: data.structure },
    { key: "functions", label: "Function", items: data.functions },
    { key: "variables", label: "Variable", items: data.variables },
    { key: "logic", label: "Logic", items: data.logic },
    { key: "syntax", label: "Syntax", items: data.syntax },
  ];

  for (const source of sources) {
    source.items.forEach((item, idx) => {
      steps.push({
        title: item.label,
        detail: item.detail,
        lines: item.lines,
        confidence: item.confidence ?? (item.lines ? "exact" : "unmapped"),
        sectionKey: source.key,
        itemIndex: idx,
        stepType: source.label,
      });
    });
  }

  data.dataFlow.forEach((step, idx) => {
    steps.push({
      title: step.label,
      detail: step.detail,
      lines: step.lines,
      confidence: step.lines ? "exact" : "unmapped",
      sectionKey: "dataFlow",
      itemIndex: idx,
      stepType: "Flow",
    });
  });

  steps.sort((a, b) => {
    const aLine = a.lines?.start ?? Infinity;
    const bLine = b.lines?.start ?? Infinity;
    return aLine - bLine;
  });

  const seen = new Set<string>();
  return steps.filter((s) => {
    const key = `${s.lines?.start}-${s.lines?.end}-${s.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Step dots
// ---------------------------------------------------------------------------

const StepDot = ({ index, active, completed, onClick }: {
  index: number;
  active: boolean;
  completed: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${
      active
        ? "bg-sage scale-125 shadow-sm"
        : completed
        ? "bg-sage/40"
        : "bg-border hover:bg-muted-foreground/30"
    }`}
    aria-label={`Go to step ${index + 1}`}
  />
);

// ---------------------------------------------------------------------------
// GuidedMode
// ---------------------------------------------------------------------------

interface GuidedModeProps {
  data: CodeExplanation;
  onScrollToLine?: (line: number) => void;
  onBackToBrowse?: () => void;
}

const GuidedMode = ({ data, onScrollToLine, onBackToBrowse }: GuidedModeProps) => {
  const steps = buildGuidedSteps(data);
  const [currentStep, setCurrentStep] = useState(0);
  const { pinHighlight } = useHighlight();
  const contentRef = useRef<HTMLDivElement>(null);
  // Track previous step to avoid re-triggering effects on same step
  const prevStepRef = useRef(-1);

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const progress = steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 100;

  // Pin highlight and scroll code viewer when step changes
  useEffect(() => {
    if (!step || currentStep === prevStepRef.current) return;
    prevStepRef.current = currentStep;

    const itemId = makeItemId(step.sectionKey, step.itemIndex);
    pinHighlight(itemId, step.lines, step.confidence);

    // Scroll code viewer to the relevant line
    if (step.lines && onScrollToLine) {
      onScrollToLine(step.lines.start);
    }
  }, [currentStep, step, pinHighlight, onScrollToLine]);

  // Scroll content into view on mobile when step changes
  useEffect(() => {
    if (contentRef.current && window.innerWidth < 1024) {
      contentRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentStep]);

  const goTo = useCallback((idx: number) => {
    setCurrentStep(Math.max(0, Math.min(steps.length - 1, idx)));
  }, [steps.length]);

  const goNext = useCallback(() => goTo(currentStep + 1), [currentStep, goTo]);
  const goPrev = useCallback(() => goTo(currentStep - 1), [currentStep, goTo]);
  const restart = useCallback(() => goTo(0), [goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  if (!steps.length) {
    return (
      <div className="surface-elevated rounded-xl border border-border p-5 sm:p-6 text-center">
        <Lightbulb className="w-6 h-6 text-sage mx-auto mb-3" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Not enough detail for a guided walkthrough. Try the Browse view instead.
        </p>
      </div>
    );
  }

  return (
    <div ref={contentRef} className="surface-elevated rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/60 px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sage" />
          <h2 className="font-semibold text-[13px] sm:text-sm text-foreground">Follow along</h2>
          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {currentStep + 1}/{steps.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onBackToBrowse && (
            <button
              onClick={onBackToBrowse}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors"
            >
              <BookOpen className="w-3 h-3" />
              <span className="hidden sm:inline">Back to Browse</span>
              <span className="sm:hidden">Browse</span>
            </button>
          )}
          {!isFirst && (
            <button
              onClick={restart}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Restart</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 sm:h-1 bg-muted/50">
        <div
          className="h-full bg-sage transition-all duration-500 ease-out rounded-r-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step content */}
      <div className="px-4 sm:px-6 py-5 sm:py-6 min-h-[180px] sm:min-h-[200px] flex flex-col">
        {/* Step badge + line ref */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-sage bg-sage-light px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
            Step {currentStep + 1} · {step.stepType}
          </span>
          {step.lines && (
            <span className="text-[10px] text-muted-foreground/50">
              {step.confidence === "broad"
                ? step.lines.start === step.lines.end
                  ? `Around line ${step.lines.start}`
                  : `Around lines ${step.lines.start}–${step.lines.end}`
                : step.lines.start === step.lines.end
                ? `Line ${step.lines.start}`
                : `Lines ${step.lines.start}–${step.lines.end}`}
            </span>
          )}
          {!step.lines && (
            <span className="text-[10px] text-muted-foreground/40 italic">General concept</span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-xl font-bold text-foreground mb-2.5 sm:mb-3 leading-snug">
          {step.title}
        </h3>

        {/* Detail */}
        <p className="text-[13px] sm:text-[15px] text-muted-foreground leading-relaxed flex-1">
          {step.detail}
        </p>

        {/* Completion */}
        {isLast && currentStep > 0 && (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-sage-light/60 border border-sage-medium/30 px-3.5 sm:px-4 py-3 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-sage mt-0.5 shrink-0" />
              <p className="text-[12px] sm:text-[13px] text-foreground leading-relaxed">
                You've walked through the entire code! Review any step, or switch to Browse for the full breakdown.
              </p>
            </div>
            {onBackToBrowse && (
              <button
                onClick={onBackToBrowse}
                className="w-full inline-flex items-center justify-center gap-2 text-[13px] sm:text-sm font-medium px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/60 text-foreground transition-all duration-200 active:scale-[0.98]"
              >
                <BookOpen className="w-4 h-4" />
                Back to Browse — review all explanations
              </button>
            )}
          </div>
        )}
      </div>

      {/* Step dots */}
      {steps.length > 1 && steps.length <= 15 && (
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 px-4 pb-2.5 sm:pb-3">
          {steps.map((_, i) => (
            <StepDot
              key={i}
              index={i}
              active={i === currentStep}
              completed={i < currentStep}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="border-t border-border/40 px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <button
          onClick={goPrev}
          disabled={isFirst}
          className={`inline-flex items-center gap-1 sm:gap-1.5 text-[13px] sm:text-sm font-medium px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200 ${
            isFirst
              ? "text-muted-foreground/30 cursor-not-allowed"
              : "text-foreground hover:bg-muted active:scale-[0.97]"
          }`}
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Back</span>
        </button>

        <p className="text-[10px] text-muted-foreground/40 hidden md:block">
          ← → arrow keys
        </p>

        <button
          onClick={isLast ? restart : goNext}
          className="inline-flex items-center gap-1 sm:gap-1.5 text-[13px] sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-sage text-primary-foreground hover:bg-sage/90 transition-all duration-200 active:scale-[0.97] shadow-sm"
        >
          {isLast ? (
            <>
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Start over</span>
              <span className="sm:hidden">Restart</span>
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GuidedMode;
