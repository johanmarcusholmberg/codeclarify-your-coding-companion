import { useState, useEffect, useCallback } from "react";
import {
  Lightbulb,
  Layers,
  Code2,
  Variable,
  GitBranch,
  Hash,
  MessageSquare,
  GraduationCap,
  BookOpen,
  Copy,
  Check,
  ChevronDown,
  Info,
  Link2,
  ArrowRight,
  AlertTriangle,
  Workflow,
  Share2,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  FileText,
} from "lucide-react";
import type {
  CodeExplanation,
  ExplanationItemId,
  Relationship,
  DataFlowStep,
  ContextSuggestion,
  RelationshipType,
  MappingConfidence,
  MappingType,
} from "@/lib/explanationEngine";
import { makeItemId } from "@/lib/explanationEngine";
import { useHighlight } from "@/contexts/HighlightContext";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Beginner-friendly section config
// ---------------------------------------------------------------------------

const ITEM_SECTIONS = [
  { key: "structure" as const, label: "Important parts", subtitle: "The building blocks of this code", icon: <Layers className="w-4 h-4" /> },
  { key: "functions" as const, label: "Functions & actions", subtitle: "Reusable actions the code can perform", icon: <Code2 className="w-4 h-4" /> },
  { key: "variables" as const, label: "Variables & values", subtitle: "Named values the code keeps track of", icon: <Variable className="w-4 h-4" /> },
  { key: "logic" as const, label: "How the logic works", subtitle: "Decisions and repetitions in the code", icon: <GitBranch className="w-4 h-4" /> },
  { key: "syntax" as const, label: "Language basics", subtitle: "Programming language rules used here", icon: <Hash className="w-4 h-4" /> },
  { key: "suggestions" as const, label: "Possible improvements", subtitle: "Ways this code could be even better", icon: <MessageSquare className="w-4 h-4" /> },
];

// ---------------------------------------------------------------------------
// Relationship badge
// ---------------------------------------------------------------------------

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  "uses": "uses",
  "called-by": "called by",
  "depends-on": "depends on",
  "returns": "returns",
  "updates": "updates",
  "filters": "filters",
  "loops-through": "loops through",
  "defines": "defines",
  "passes-to": "passes to",
};

const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  "uses": "bg-sky-50 text-sky-700 border-sky-200",
  "called-by": "bg-amber-50 text-amber-700 border-amber-200",
  "depends-on": "bg-rose-50 text-rose-700 border-rose-200",
  "returns": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "updates": "bg-orange-50 text-orange-700 border-orange-200",
  "filters": "bg-violet-50 text-violet-700 border-violet-200",
  "loops-through": "bg-teal-50 text-teal-700 border-teal-200",
  "defines": "bg-slate-50 text-slate-600 border-slate-200",
  "passes-to": "bg-blue-50 text-blue-700 border-blue-200",
};

const RelationshipBadge = ({ type }: { type: RelationshipType }) => (
  <span
    className={`inline-flex items-center text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full border ${RELATIONSHIP_COLORS[type]}`}
  >
    {RELATIONSHIP_LABELS[type]}
  </span>
);

// ---------------------------------------------------------------------------
// Feedback system
// ---------------------------------------------------------------------------

type FeedbackType = "correct" | "wrong-section" | "too-broad" | "unclear";

const FEEDBACK_OPTIONS: { type: FeedbackType; label: string; icon: React.ReactNode }[] = [
  { type: "correct", label: "Correct match", icon: <ThumbsUp className="w-3 h-3" /> },
  { type: "wrong-section", label: "Wrong section", icon: <ThumbsDown className="w-3 h-3" /> },
  { type: "too-broad", label: "Too broad", icon: <MoreHorizontal className="w-3 h-3" /> },
  { type: "unclear", label: "Unclear", icon: <Info className="w-3 h-3" /> },
];

const FEEDBACK_STORAGE_KEY = "codeclarify_feedback";

function loadFeedback(): Record<string, FeedbackType> {
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveFeedbackEntry(itemId: string, feedback: FeedbackType | null) {
  try {
    const existing = loadFeedback();
    if (feedback === null) {
      delete existing[itemId];
    } else {
      existing[itemId] = feedback;
    }
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(existing));
  } catch { /* quota */ }
}

const FeedbackControls = ({ itemId }: { itemId: string }) => {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<FeedbackType | null>(() => {
    const all = loadFeedback();
    return all[itemId] ?? null;
  });

  const handleFeedback = useCallback((type: FeedbackType) => {
    const newVal = current === type ? null : type;
    setCurrent(newVal);
    saveFeedbackEntry(itemId, newVal);
    if (newVal) {
      toast.success("Thanks for your feedback!", { duration: 1500 });
    }
    setOpen(false);
  }, [current, itemId]);

  if (current) {
    const chosen = FEEDBACK_OPTIONS.find((o) => o.type === current);
    return (
      <button
        onClick={() => handleFeedback(current)}
        className="inline-flex items-center gap-1 text-[10px] font-medium text-sage bg-sage-light px-2 py-0.5 rounded-full hover:bg-sage-light/80 transition-colors"
        title="Click to remove feedback"
      >
        {chosen?.icon}
        {chosen?.label}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/50 hover:text-muted-foreground px-1.5 py-0.5 rounded-full hover:bg-muted/60 transition-colors"
        title="Give feedback on this explanation"
      >
        <ThumbsUp className="w-2.5 h-2.5" />
        <ThumbsDown className="w-2.5 h-2.5" />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-1 bg-card border border-border rounded-lg shadow-lg p-1 z-10 min-w-[140px] animate-fade-in">
          {FEEDBACK_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() => handleFeedback(opt.type)}
              className="w-full flex items-center gap-2 text-[11px] text-foreground hover:bg-muted/60 px-2.5 py-1.5 rounded-md transition-colors text-left"
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Collapsible section
// ---------------------------------------------------------------------------

interface CollapsibleSectionProps {
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  animDelay: number;
  badge?: React.ReactNode;
}

const CollapsibleSection = ({
  label,
  subtitle,
  icon,
  defaultOpen = false,
  children,
  animDelay,
  badge,
}: CollapsibleSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="border-b border-border/40 last:border-b-0 animate-fade-up"
      style={{ animationDelay: `${animDelay}s` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left hover:bg-muted/40 transition-colors duration-200 active:scale-[0.995]"
      >
        <div className="w-7 h-7 rounded-lg bg-sage-light flex items-center justify-center shrink-0 text-sage">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm text-foreground flex items-center gap-2">
            {label}
            {badge}
          </span>
          {subtitle && !open && (
            <p className="text-[11px] text-muted-foreground/60 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 sm:px-5 pb-4 sm:pl-[3.75rem] space-y-3">{children}</div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Line reference label
// ---------------------------------------------------------------------------

function lineRefLabel(lines?: { start: number; end: number }, confidence?: MappingConfidence): string {
  const conf = confidence ?? (lines ? "exact" : "unmapped");
  if (conf === "unmapped" || !lines) return "General explanation";
  if (conf === "broad") return lines.start === lines.end
    ? `Around line ${lines.start}`
    : `Across lines ${lines.start}–${lines.end}`;
  if (conf === "likely") return lines.start === lines.end
    ? `Likely line ${lines.start}`
    : `Likely lines ${lines.start}–${lines.end}`;
  return lines.start === lines.end ? `Line ${lines.start}` : `Lines ${lines.start}–${lines.end}`;
}

function unmappedHint(confidence?: MappingConfidence, mappingType?: MappingType): string | null {
  if (mappingType === "conceptual") return "This is a conceptual explanation — not tied to one specific location";
  if (mappingType === "flow") return "This explains how data or execution flows across the code";
  if (mappingType === "relationship") return "This describes how different parts of the code interact";
  if (confidence === "unmapped") return "This is a high-level explanation of the overall code";
  if (confidence === "broad") return "This explanation refers to several places in the code";
  return null;
}

const CONFIDENCE_STYLES: Record<MappingConfidence, string> = {
  exact: "text-sage bg-sage-light",
  likely: "text-sage/80 bg-sage-light/70",
  broad: "text-muted-foreground bg-muted",
  unmapped: "text-muted-foreground/60 bg-muted/50",
};

const MAPPING_TYPE_LABELS: Record<MappingType, string> = {
  "code-location": "Code",
  "conceptual": "Concept",
  "flow": "Flow",
  "relationship": "Connection",
};

// ---------------------------------------------------------------------------
// Item card — beginner-friendly with feedback
// ---------------------------------------------------------------------------

interface ItemCardProps {
  label: string;
  detail: string;
  itemId: ExplanationItemId;
  lines?: { start: number; end: number };
  confidence?: MappingConfidence;
  mappingType?: MappingType;
  reasoning?: string;
}

const ItemCard = ({ label, detail, itemId, lines, confidence, mappingType, reasoning }: ItemCardProps) => {
  const { activeItemId, pinned: isPinned, pinHighlight } = useHighlight();
  const isActive = activeItemId === itemId;
  const conf: MappingConfidence = confidence ?? (lines ? "exact" : "unmapped");
  const mType: MappingType = mappingType ?? (lines ? "code-location" : "conceptual");
  const hasLines = !!lines;
  const hint = unmappedHint(conf, mType);

  return (
    <div
      className={`rounded-xl border px-4 py-3.5 transition-all duration-200 ${
        isActive && isPinned
          ? "bg-code-highlight border-sage shadow-sm ring-1 ring-sage/20"
          : isActive
          ? "bg-code-highlight border-sage-medium/60 shadow-sm"
          : "bg-card border-border/50 hover:border-border/80 hover:shadow-sm"
      } ${hasLines ? "cursor-pointer" : ""}`}
      data-item-id={itemId}
      role={hasLines ? "button" : undefined}
      tabIndex={hasLines ? 0 : undefined}
      onClick={() => hasLines && pinHighlight(itemId, lines, conf)}
      aria-label={hasLines ? `${label} — click to pin highlight` : undefined}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-sm font-semibold text-foreground leading-snug">{label}</p>
        <FeedbackControls itemId={itemId} />
      </div>

      {/* Detail text */}
      <p className="text-[13px] text-muted-foreground leading-relaxed">{detail}</p>

      {/* Reasoning (why this mapping) */}
      {reasoning && (
        <p className="text-[11px] text-muted-foreground/40 mt-1.5 italic">
          ↳ {reasoning}
        </p>
      )}

      {/* Hint for broad/unmapped/conceptual */}
      {hint && (
        <p className="text-[11px] text-muted-foreground/50 mt-1.5 italic flex items-center gap-1">
          <Info className="w-3 h-3 shrink-0" />
          {hint}
        </p>
      )}

      {/* Footer: mapping type + line ref + pin status */}
      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
        {mType !== "code-location" && (
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50 bg-muted/40 px-1.5 py-0.5 rounded">
            {MAPPING_TYPE_LABELS[mType]}
          </span>
        )}
        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${CONFIDENCE_STYLES[conf]}`}>
          {conf === "unmapped" && <FileText className="w-2.5 h-2.5" />}
          {lineRefLabel(lines, confidence)}
        </span>
        {isActive && isPinned && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-sage">
            <MapPin className="w-2.5 h-2.5" /> Pinned
          </span>
        )}
      </div>
    </div>
  );
};

interface ItemCardWrapperProps {
  item: { label: string; detail: string; lines?: { start: number; end: number }; confidence?: MappingConfidence; mappingType?: MappingType; reasoning?: string };
  sectionKey: string;
  itemIndex: number;
}

const ItemCardWrapper = ({ item, sectionKey, itemIndex }: ItemCardWrapperProps) => {
  const { highlightFromExplanation, clearHighlight } = useHighlight();
  const itemId = makeItemId(sectionKey, itemIndex);
  const conf: MappingConfidence = item.confidence ?? (item.lines ? "exact" : "unmapped");

  return (
    <div
      onMouseEnter={() => highlightFromExplanation(itemId, item.lines, conf)}
      onMouseLeave={clearHighlight}
    >
      <ItemCard
        label={item.label}
        detail={item.detail}
        itemId={itemId}
        lines={item.lines}
        confidence={item.confidence}
        mappingType={item.mappingType}
        reasoning={item.reasoning}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Relationship card
// ---------------------------------------------------------------------------

const RelationshipCard = ({ rel, index }: { rel: Relationship; index: number }) => {
  const { highlightFromExplanation, clearHighlight } = useHighlight();
  const itemId = makeItemId("relationships", index);
  const hasLines = !!(rel.fromLines || rel.toLines);

  const mergedLines = rel.fromLines && rel.toLines
    ? { start: Math.min(rel.fromLines.start, rel.toLines.start), end: Math.max(rel.fromLines.end, rel.toLines.end) }
    : rel.fromLines || rel.toLines;

  return (
    <div
      className="rounded-xl border border-border/50 bg-card px-4 py-3.5 transition-all duration-200 hover:bg-code-highlight hover:border-sage-medium/60 hover:shadow-sm cursor-pointer"
      onMouseEnter={() => hasLines && highlightFromExplanation(itemId, mergedLines)}
      onMouseLeave={clearHighlight}
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-[13px] sm:text-sm font-semibold text-foreground">{rel.from}</span>
        <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
        <span className="text-[13px] sm:text-sm font-semibold text-foreground">{rel.to}</span>
        <RelationshipBadge type={rel.type} />
      </div>
      <p className="text-[13px] text-muted-foreground leading-relaxed">{rel.detail}</p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Data flow step
// ---------------------------------------------------------------------------

const DataFlowCard = ({ step, index }: { step: DataFlowStep; index: number }) => {
  const { highlightFromExplanation, clearHighlight } = useHighlight();
  const itemId = makeItemId("dataFlow", index);

  return (
    <div
      className="flex gap-3 group"
      onMouseEnter={() => step.lines && highlightFromExplanation(itemId, step.lines)}
      onMouseLeave={clearHighlight}
    >
      <div className="flex flex-col items-center pt-1">
        <div className="w-6 h-6 rounded-full bg-sage-light border-2 border-sage-medium/40 flex items-center justify-center text-[10px] font-bold text-sage shrink-0">
          {index + 1}
        </div>
        <div className="w-px flex-1 bg-sage-medium/30 mt-1" />
      </div>
      <div className={`rounded-xl border border-border/50 bg-card px-4 py-3.5 flex-1 mb-2 transition-all duration-200 ${step.lines ? "cursor-pointer group-hover:bg-code-highlight group-hover:border-sage-medium/60 group-hover:shadow-sm" : ""}`}>
        <p className="text-sm font-semibold text-foreground mb-1">{step.label}</p>
        <p className="text-[13px] text-muted-foreground leading-relaxed">{step.detail}</p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Context suggestion card
// ---------------------------------------------------------------------------

const SEVERITY_STYLES = {
  info: { border: "border-sky-200/60", bg: "bg-sky-50/50", icon: <Info className="w-3.5 h-3.5 text-sky-500" />, label: "Good to know" },
  hint: { border: "border-amber-200/60", bg: "bg-amber-50/50", icon: <Lightbulb className="w-3.5 h-3.5 text-amber-500" />, label: "Helpful hint" },
  warning: { border: "border-rose-200/60", bg: "bg-rose-50/50", icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />, label: "Worth noting" },
};

const ContextSuggestionCard = ({ suggestion, index }: { suggestion: ContextSuggestion; index: number }) => {
  const { highlightFromExplanation, clearHighlight } = useHighlight();
  const itemId = makeItemId("contextSuggestions", index);
  const style = SEVERITY_STYLES[suggestion.severity];

  return (
    <div
      className={`rounded-xl border ${style.border} ${style.bg} px-4 py-3.5 transition-all duration-200 ${suggestion.lines ? "cursor-pointer hover:shadow-sm" : ""}`}
      onMouseEnter={() => suggestion.lines && highlightFromExplanation(itemId, suggestion.lines)}
      onMouseLeave={clearHighlight}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {style.icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{style.label}</span>
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">{suggestion.label}</p>
      <p className="text-[13px] text-muted-foreground leading-relaxed">{suggestion.detail}</p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Enhanced loading skeleton
// ---------------------------------------------------------------------------

const LoadingSkeleton = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-0 overflow-hidden">
      <div className="border-b border-border/60 px-4 sm:px-5 py-3.5 flex items-center gap-3">
        <div className="w-4 h-4 rounded bg-sage/20 animate-pulse" />
        <span className="text-sm font-medium text-muted-foreground">
          Reading and understanding your code{dots}
        </span>
      </div>

      <div className="px-4 sm:px-5 py-4 border-b border-border/40">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-sage-light animate-pulse shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="h-4 w-32 bg-muted rounded-md animate-pulse" />
            <div className="h-3.5 w-full bg-muted/80 rounded-md animate-pulse" style={{ animationDelay: "0.1s" }} />
            <div className="h-3.5 w-4/5 bg-muted/60 rounded-md animate-pulse" style={{ animationDelay: "0.2s" }} />
          </div>
        </div>
      </div>

      {[
        { label: "Important parts", delay: 0.1 },
        { label: "Functions & actions", delay: 0.15 },
        { label: "Variables & values", delay: 0.2 },
        { label: "How the logic works", delay: 0.25 },
      ].map((s, i) => (
        <div
          key={i}
          className="border-b border-border/40 px-4 sm:px-5 py-3.5 flex items-center gap-3 animate-fade-up"
          style={{ animationDelay: `${s.delay}s` }}
        >
          <div className="w-7 h-7 bg-muted rounded-lg animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-muted rounded-md animate-pulse" style={{ width: `${80 + i * 15}px` }} />
            <div className="h-2.5 bg-muted/40 rounded-md animate-pulse" style={{ width: `${120 + i * 10}px` }} />
          </div>
          <div className="w-4 h-4 bg-muted/60 rounded animate-pulse" />
        </div>
      ))}

      <div className="px-4 sm:px-5 py-3 bg-muted/20">
        <p className="text-[11px] text-muted-foreground/70 text-center">
          This usually takes a few seconds — we're analyzing structure, logic, and relationships
        </p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-14 sm:py-16 px-6 sm:px-8 text-center">
    <div className="w-14 h-14 rounded-2xl bg-sage-light flex items-center justify-center mb-5">
      <Lightbulb className="w-6 h-6 text-sage" />
    </div>
    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
      Your explanation will appear here
    </h3>
    <p className="text-muted-foreground text-[13px] sm:text-sm max-w-md leading-relaxed">
      Paste some code above and click &ldquo;Explain this code&rdquo; to get a
      clear, beginner-friendly breakdown of what it does.
    </p>
    <div className="flex items-center gap-1.5 mt-4 text-[11px] text-muted-foreground/60">
      <Info className="w-3 h-3" />
      <span>Tip: Try the &ldquo;Use sample code&rdquo; button to see it in action</span>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Snippet size notice
// ---------------------------------------------------------------------------

function snippetNotice(data: CodeExplanation): string | null {
  const totalItems = data.structure.length + data.functions.length + data.variables.length + data.logic.length + data.syntax.length;
  if (totalItems <= 1 && !data.relationships.length) {
    return "This is a short snippet — the explanation covers the essentials. Try pasting a larger piece of code for a more detailed breakdown.";
  }
  if (totalItems > 20) {
    return "This is a longer piece of code. Each section below focuses on a specific part — take your time exploring them.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

interface ExplanationPanelProps {
  data: CodeExplanation | null;
  isLoading?: boolean;
}

const ExplanationPanel = ({ data, isLoading }: ExplanationPanelProps) => {
  const [copied, setCopied] = useState(false);

  const buildCopyText = () => {
    if (!data) return "";
    const lines: string[] = [];
    lines.push("## What this code does\n" + data.summary + "\n");
    ITEM_SECTIONS.forEach((s) => {
      const items = data[s.key];
      if (items.length) {
        lines.push(`## ${s.label}`);
        items.forEach((it) => lines.push(`• ${it.label}: ${it.detail}`));
        lines.push("");
      }
    });
    if (data.relationships.length) {
      lines.push("## How parts connect");
      data.relationships.forEach((r) => lines.push(`• ${r.from} → ${r.to} (${RELATIONSHIP_LABELS[r.type]}): ${r.detail}`));
      lines.push("");
    }
    if (data.dataFlow.length) {
      lines.push("## Step by step");
      data.dataFlow.forEach((s, i) => lines.push(`${i + 1}. ${s.label}: ${s.detail}`));
      lines.push("");
    }
    if (data.relationshipSummary) {
      lines.push("## The big picture\n" + data.relationshipSummary + "\n");
    }
    lines.push("## Simple explanation\n" + data.beginnerMode);
    return lines.join("\n");
  };

  const handleCopy = () => {
    const text = buildCopyText();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Explanation copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    const text = buildCopyText();
    if (!text || !navigator.share) {
      handleCopy();
      return;
    }
    navigator.share({ title: "CodeClarify Explanation", text }).catch(() => {});
  };

  if (isLoading) {
    return (
      <div className="surface-elevated rounded-xl border border-border">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="surface-elevated rounded-xl border border-border/60">
        <EmptyState />
      </div>
    );
  }

  const notice = snippetNotice(data);
  let sectionIndex = 0;

  return (
    <div className="surface-elevated rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/60 px-4 sm:px-5 py-3.5 flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-sage" />
          Your code, explained
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg hover:bg-muted transition-colors duration-200 active:scale-[0.97]"
            title="Share explanation"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg hover:bg-muted transition-colors duration-200 active:scale-[0.97]"
          >
            {copied ? (
              <><Check className="w-3.5 h-3.5 text-sage" /> <span className="hidden sm:inline">Copied!</span><span className="sm:hidden">✓</span></>
            ) : (
              <><Copy className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Copy all</span><span className="sm:hidden">Copy</span></>
            )}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 sm:px-5 py-4 border-b border-border/40 animate-fade-up">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-sage-light flex items-center justify-center shrink-0 mt-0.5 text-sage">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground mb-1.5">What this code does</h3>
            <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
          </div>
        </div>
      </div>

      {/* Snippet size notice */}
      {notice && (
        <div className="px-4 sm:px-5 py-2.5 border-b border-border/30 bg-muted/20 animate-fade-up">
          <p className="text-[11px] text-muted-foreground/70 flex items-start gap-1.5 leading-relaxed">
            <Info className="w-3 h-3 shrink-0 mt-0.5" />
            {notice}
          </p>
        </div>
      )}

      {/* Item sections with beginner-friendly labels */}
      {ITEM_SECTIONS.map((section) => {
        const items = data[section.key];
        if (!items.length) return null;
        sectionIndex++;
        return (
          <CollapsibleSection
            key={section.key}
            label={section.label}
            subtitle={section.subtitle}
            icon={section.icon}
            defaultOpen={sectionIndex <= 2}
            animDelay={0.06 * sectionIndex}
            badge={
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                {items.length}
              </span>
            }
          >
            {items.map((item, i) => (
              <ItemCardWrapper key={i} item={item} sectionKey={section.key} itemIndex={i} />
            ))}
          </CollapsibleSection>
        );
      })}

      {/* Connections */}
      {data.relationships.length > 0 && (
        <CollapsibleSection
          label="How parts connect"
          subtitle="How different pieces of the code work together"
          icon={<Link2 className="w-4 h-4" />}
          defaultOpen={true}
          animDelay={0.06 * (++sectionIndex)}
          badge={
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {data.relationships.length}
            </span>
          }
        >
          {data.relationships.map((rel, i) => (
            <RelationshipCard key={i} rel={rel} index={i} />
          ))}
        </CollapsibleSection>
      )}

      {/* Data Flow */}
      {data.dataFlow.length > 0 && (
        <CollapsibleSection
          label="Step by step"
          subtitle="How information flows through the code"
          icon={<Workflow className="w-4 h-4" />}
          defaultOpen={false}
          animDelay={0.06 * (++sectionIndex)}
        >
          <div className="space-y-0">
            {data.dataFlow.map((step, i) => (
              <DataFlowCard key={i} step={step} index={i} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Big picture */}
      {data.relationshipSummary && (
        <CollapsibleSection
          label="The big picture"
          subtitle="How everything fits together"
          icon={<Layers className="w-4 h-4" />}
          defaultOpen={false}
          animDelay={0.06 * (++sectionIndex)}
        >
          <div className="rounded-xl bg-accent/50 border border-accent-foreground/10 px-4 py-3.5">
            <p className="text-[13px] sm:text-sm text-foreground leading-relaxed">{data.relationshipSummary}</p>
          </div>
        </CollapsibleSection>
      )}

      {/* Context Insights */}
      {data.contextSuggestions.length > 0 && (
        <CollapsibleSection
          label="Things to notice"
          subtitle="Patterns and observations worth knowing"
          icon={<AlertTriangle className="w-4 h-4" />}
          defaultOpen={false}
          animDelay={0.06 * (++sectionIndex)}
          badge={
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {data.contextSuggestions.length}
            </span>
          }
        >
          {data.contextSuggestions.map((s, i) => (
            <ContextSuggestionCard key={i} suggestion={s} index={i} />
          ))}
        </CollapsibleSection>
      )}

      {/* Simple explanation */}
      <CollapsibleSection
        label="Simple explanation"
        subtitle="A beginner-friendly way to think about this code"
        icon={<GraduationCap className="w-4 h-4" />}
        defaultOpen={false}
        animDelay={0.06 * (++sectionIndex)}
      >
        <div className="rounded-xl bg-sage-light/60 border border-sage-medium/30 px-4 py-3.5">
          <p className="text-[13px] sm:text-sm text-foreground leading-relaxed">{data.beginnerMode}</p>
        </div>
      </CollapsibleSection>

      {/* Disclaimer */}
      <div className="px-4 sm:px-5 py-3 border-t border-border/40 bg-muted/30">
        <p className="text-[11px] text-muted-foreground flex items-start gap-1.5 leading-relaxed">
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          <span>
            Explanations are AI-generated for learning purposes and may not always be perfectly accurate.
            Always review and verify important code yourself. Your feedback helps us improve!
          </span>
        </p>
      </div>
    </div>
  );
};

export default ExplanationPanel;
