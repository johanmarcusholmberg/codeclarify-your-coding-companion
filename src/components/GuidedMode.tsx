import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  Lightbulb,
  CheckCircle2,
  Circle,
} from "lucide-react";
import type { CodeExplanation, LineRange, MappingConfidence, MappingType } from "@/lib/explanationEngine";
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
  /** Friendly step type for the badge */
  stepType: string;
}

function buildGuidedSteps(data: CodeExplanation): GuidedStep[] {
  const steps: GuidedStep[] = [];

  // Collect all items with line info, sorted by start line
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

  // Also include dataFlow steps
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

  // Sort by line number (items without lines go to the end)
  steps.sort((a, b) => {
    const aLine = a.lines?.start ?? Infinity;
    const bLine = b.lines?.start ?? Infinity;
    return aLine - bLine;
  });

  // Deduplicate items that cover the same lines with the same detail
  const seen = new Set<string>();
  return steps.filter((s) => {
    const key = `${s.lines?.start}-${s.lines?.end}-${s.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Step indicator dot
// ---------------------------------------------------------------------------

const StepDot = ({ index, active, completed, onClick }: {
  index: number;
  active: boolean;
  completed: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
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
// GuidedMode component
// ---------------------------------------------------------------------------

interface GuidedModeProps {
  data: CodeExplanation;
}

const GuidedMode = ({ data }: GuidedModeProps) => {
  const steps = buildGuidedSteps(data);
  const [currentStep, setCurrentStep] = useState(0);
  const { pinHighlight, clearHighlight } = useHighlight();
  const stepRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const progress = steps.length > 1 ? ((currentStep) / (steps.length - 1)) * 100 : 100;

  // Pin highlight when step changes
  useEffect(() => {
    if (!step) return;
    const itemId = makeItemId(step.sectionKey, step.itemIndex);
    pinHighlight(itemId, step.lines, step.confidence);
  }, [currentStep, step, pinHighlight]);

  const goTo = useCallback((idx: number) => {
    setCurrentStep(Math.max(0, Math.min(steps.length - 1, idx)));
  }, [steps.length]);

  const goNext = useCallback(() => goTo(currentStep + 1), [currentStep, goTo]);
  const goPrev = useCallback(() => goTo(currentStep - 1), [currentStep, goTo]);
  const restart = useCallback(() => { goTo(0); }, [goTo]);

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
      <div className="surface-elevated rounded-xl border border-border p-6 text-center">
        <Lightbulb className="w-6 h-6 text-sage mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Not enough detail to build a guided walkthrough for this snippet. Try the categorized view instead.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-elevated rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/60 px-4 sm:px-5 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-sage" />
          <h2 className="font-semibold text-sm text-foreground">Follow along</h2>
          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {currentStep + 1} of {steps.length}
          </span>
        </div>
        {!isFirst && (
          <button
            onClick={restart}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Restart
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted/50">
        <div
          className="h-full bg-sage transition-all duration-500 ease-out rounded-r-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step content */}
      <div ref={stepRef} className="px-5 sm:px-6 py-6 min-h-[200px] flex flex-col">
        {/* Step type badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-sage bg-sage-light px-2.5 py-1 rounded-full">
            Step {currentStep + 1} · {step.stepType}
          </span>
          {step.lines && (
            <span className="text-[10px] text-muted-foreground/60">
              {step.lines.start === step.lines.end ? `Line ${step.lines.start}` : `Lines ${step.lines.start}–${step.lines.end}`}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 leading-snug">
          {step.title}
        </h3>

        {/* Detail */}
        <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed flex-1">
          {step.detail}
        </p>

        {/* Completion message */}
        {isLast && currentStep > 0 && (
          <div className="mt-4 rounded-lg bg-sage-light/60 border border-sage-medium/30 px-4 py-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-sage mt-0.5 shrink-0" />
            <p className="text-[13px] text-foreground leading-relaxed">
              You've walked through the entire code! Go back to review any step, or switch to the categorized view for more detail.
            </p>
          </div>
        )}
      </div>

      {/* Step dots */}
      {steps.length > 1 && steps.length <= 15 && (
        <div className="flex items-center justify-center gap-1.5 px-4 pb-3">
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

      {/* Navigation footer */}
      <div className="border-t border-border/40 px-4 sm:px-5 py-3 flex items-center justify-between gap-2">
        <button
          onClick={goPrev}
          disabled={isFirst}
          className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
            isFirst
              ? "text-muted-foreground/30 cursor-not-allowed"
              : "text-foreground hover:bg-muted active:scale-[0.97]"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <p className="text-[11px] text-muted-foreground/50 hidden sm:block">
          Use ← → arrow keys to navigate
        </p>

        <button
          onClick={isLast ? restart : goNext}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-sage text-primary-foreground hover:bg-sage/90 transition-all duration-200 active:scale-[0.97] shadow-sm"
        >
          {isLast ? (
            <>
              <RotateCcw className="w-4 h-4" />
              Start over
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GuidedMode;
