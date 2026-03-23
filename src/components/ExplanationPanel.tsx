import { useState } from "react";
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
} from "lucide-react";
import type {
  CodeExplanation,
  ExplanationItemId,
  Relationship,
  DataFlowStep,
  ContextSuggestion,
  RelationshipType,
} from "@/lib/explanationEngine";
import { makeItemId } from "@/lib/explanationEngine";
import { useHighlight } from "@/contexts/HighlightContext";

// ---------------------------------------------------------------------------
// Section config — only for ExplanationItem[] sections
// ---------------------------------------------------------------------------

const ITEM_SECTIONS = [
  { key: "structure" as const, label: "Structure", icon: <Layers className="w-4 h-4" /> },
  { key: "functions" as const, label: "Functions", icon: <Code2 className="w-4 h-4" /> },
  { key: "variables" as const, label: "Variables", icon: <Variable className="w-4 h-4" /> },
  { key: "logic" as const, label: "Logic", icon: <GitBranch className="w-4 h-4" /> },
  { key: "syntax" as const, label: "Syntax", icon: <Hash className="w-4 h-4" /> },
  { key: "suggestions" as const, label: "Suggestions", icon: <MessageSquare className="w-4 h-4" /> },
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
// Collapsible section
// ---------------------------------------------------------------------------

interface CollapsibleSectionProps {
  label: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  animDelay: number;
  badge?: React.ReactNode;
}

const CollapsibleSection = ({
  label,
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
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/40 transition-colors duration-200 active:scale-[0.995]"
      >
        <div className="w-7 h-7 rounded-lg bg-sage-light flex items-center justify-center shrink-0 text-sage">
          {icon}
        </div>
        <span className="font-medium text-sm text-foreground flex-1 flex items-center gap-2">
          {label}
          {badge}
        </span>
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
          <div className="px-5 pb-4 pl-[3.75rem] space-y-2.5">{children}</div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Item card — with highlight interaction
// ---------------------------------------------------------------------------

interface ItemCardProps {
  label: string;
  detail: string;
  itemId: ExplanationItemId;
  hasLines: boolean;
}

const ItemCard = ({ label, detail, itemId, hasLines }: ItemCardProps) => {
  const { activeItemId } = useHighlight();
  const isActive = activeItemId === itemId;

  return (
    <div
      className={`rounded-lg border px-4 py-3 transition-all duration-200 ${
        isActive
          ? "bg-code-highlight border-sage-medium/60 shadow-sm"
          : "bg-muted/50 border-border/40"
      } ${hasLines ? "cursor-pointer" : ""}`}
      data-item-id={itemId}
      role={hasLines ? "button" : undefined}
      tabIndex={hasLines ? 0 : undefined}
      aria-label={hasLines ? `${label} — hover to highlight related code` : undefined}
    >
      <p className="text-sm font-medium text-foreground mb-1">{label}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{detail}</p>
      {hasLines && (
        <span className="inline-block mt-1.5 text-[11px] text-sage font-medium opacity-70">
          ↔ hover to see in code
        </span>
      )}
    </div>
  );
};

interface ItemCardWrapperProps {
  item: { label: string; detail: string; lines?: { start: number; end: number } };
  sectionKey: string;
  itemIndex: number;
}

const ItemCardWrapper = ({ item, sectionKey, itemIndex }: ItemCardWrapperProps) => {
  const { highlightFromExplanation, clearHighlight } = useHighlight();
  const itemId = makeItemId(sectionKey, itemIndex);

  return (
    <div
      onMouseEnter={() => highlightFromExplanation(itemId, item.lines)}
      onMouseLeave={clearHighlight}
    >
      <ItemCard
        label={item.label}
        detail={item.detail}
        itemId={itemId}
        hasLines={!!item.lines}
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

  // Highlight the full range from→to
  const mergedLines = rel.fromLines && rel.toLines
    ? { start: Math.min(rel.fromLines.start, rel.toLines.start), end: Math.max(rel.fromLines.end, rel.toLines.end) }
    : rel.fromLines || rel.toLines;

  return (
    <div
      className="rounded-lg border border-border/40 bg-muted/50 px-4 py-3 transition-all duration-200 hover:bg-code-highlight hover:border-sage-medium/60 cursor-pointer"
      onMouseEnter={() => hasLines && highlightFromExplanation(itemId, mergedLines)}
      onMouseLeave={clearHighlight}
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-sm font-medium text-foreground">{rel.from}</span>
        <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-foreground">{rel.to}</span>
        <RelationshipBadge type={rel.type} />
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{rel.detail}</p>
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
      {/* Step indicator */}
      <div className="flex flex-col items-center pt-1">
        <div className="w-6 h-6 rounded-full bg-sage-light border-2 border-sage-medium/40 flex items-center justify-center text-[10px] font-bold text-sage shrink-0">
          {index + 1}
        </div>
        {/* Connector line */}
        <div className="w-px flex-1 bg-sage-medium/30 mt-1" />
      </div>
      <div className={`rounded-lg border border-border/40 bg-muted/50 px-4 py-3 flex-1 mb-2 transition-all duration-200 ${step.lines ? "cursor-pointer group-hover:bg-code-highlight group-hover:border-sage-medium/60" : ""}`}>
        <p className="text-sm font-medium text-foreground mb-0.5">{step.label}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{step.detail}</p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Context suggestion card
// ---------------------------------------------------------------------------

const SEVERITY_STYLES = {
  info: { border: "border-sky-200/60", bg: "bg-sky-50/50", icon: <Info className="w-3.5 h-3.5 text-sky-500" />, label: "Info" },
  hint: { border: "border-amber-200/60", bg: "bg-amber-50/50", icon: <Lightbulb className="w-3.5 h-3.5 text-amber-500" />, label: "Hint" },
  warning: { border: "border-rose-200/60", bg: "bg-rose-50/50", icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />, label: "Notice" },
};

const ContextSuggestionCard = ({ suggestion, index }: { suggestion: ContextSuggestion; index: number }) => {
  const { highlightFromExplanation, clearHighlight } = useHighlight();
  const itemId = makeItemId("contextSuggestions", index);
  const style = SEVERITY_STYLES[suggestion.severity];

  return (
    <div
      className={`rounded-lg border ${style.border} ${style.bg} px-4 py-3 transition-all duration-200 ${suggestion.lines ? "cursor-pointer hover:shadow-sm" : ""}`}
      onMouseEnter={() => suggestion.lines && highlightFromExplanation(itemId, suggestion.lines)}
      onMouseLeave={clearHighlight}
    >
      <div className="flex items-center gap-2 mb-1">
        {style.icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{style.label}</span>
      </div>
      <p className="text-sm font-medium text-foreground mb-0.5">{suggestion.label}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{suggestion.detail}</p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Empty & loading states
// ---------------------------------------------------------------------------

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
    <div className="w-14 h-14 rounded-2xl bg-sage-light flex items-center justify-center mb-5">
      <Lightbulb className="w-6 h-6 text-sage" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">
      Your explanation will appear here
    </h3>
    <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
      Paste some code above and click &ldquo;Explain this code&rdquo; to get a
      clear, beginner-friendly breakdown of what it does.
    </p>
  </div>
);

const LoadingSkeleton = () => (
  <div className="space-y-5 p-6 animate-pulse">
    <div className="space-y-2">
      <div className="h-5 w-24 bg-muted rounded-md" />
      <div className="h-4 w-full bg-muted rounded-md" />
      <div className="h-4 w-3/4 bg-muted rounded-md" />
    </div>
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center gap-3 py-3">
        <div className="h-7 w-7 bg-muted rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 bg-muted rounded-md" />
          <div className="h-3 w-full bg-muted rounded-md" />
        </div>
      </div>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

interface ExplanationPanelProps {
  data: CodeExplanation | null;
  isLoading?: boolean;
}

const ExplanationPanel = ({ data, isLoading }: ExplanationPanelProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push("## Summary\n" + data.summary + "\n");
    ITEM_SECTIONS.forEach((s) => {
      const items = data[s.key];
      if (items.length) {
        lines.push(`## ${s.label}`);
        items.forEach((it) => lines.push(`• ${it.label}: ${it.detail}`));
        lines.push("");
      }
    });
    if (data.relationships.length) {
      lines.push("## Connections");
      data.relationships.forEach((r) => lines.push(`• ${r.from} → ${r.to} (${RELATIONSHIP_LABELS[r.type]}): ${r.detail}`));
      lines.push("");
    }
    if (data.dataFlow.length) {
      lines.push("## Data Flow");
      data.dataFlow.forEach((s, i) => lines.push(`${i + 1}. ${s.label}: ${s.detail}`));
      lines.push("");
    }
    if (data.relationshipSummary) {
      lines.push("## How It All Fits Together\n" + data.relationshipSummary + "\n");
    }
    lines.push("## Beginner Mode\n" + data.beginnerMode);
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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

  let sectionIndex = 0;

  return (
    <div className="surface-elevated rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/60 px-5 py-3.5 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-sage" />
          Explanation
        </h2>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors duration-200 active:scale-[0.97]"
        >
          {copied ? (
            <><Check className="w-3.5 h-3.5 text-sage" /> Copied</>
          ) : (
            <><Copy className="w-3.5 h-3.5" /> Copy</>
          )}
        </button>
      </div>

      {/* Summary */}
      <div className="px-5 py-4 border-b border-border/40 animate-fade-up">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-sage-light flex items-center justify-center shrink-0 mt-0.5 text-sage">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm text-foreground mb-1">Summary</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
          </div>
        </div>
      </div>

      {/* Existing item sections */}
      {ITEM_SECTIONS.map((section) => {
        const items = data[section.key];
        if (!items.length) return null;
        sectionIndex++;
        return (
          <CollapsibleSection
            key={section.key}
            label={section.label}
            icon={section.icon}
            defaultOpen={sectionIndex <= 2}
            animDelay={0.06 * sectionIndex}
          >
            {items.map((item, i) => (
              <ItemCardWrapper key={i} item={item} sectionKey={section.key} itemIndex={i} />
            ))}
          </CollapsibleSection>
        );
      })}

      {/* NEW: Connections / Relationships */}
      {data.relationships.length > 0 && (
        <CollapsibleSection
          label="Connections"
          icon={<Link2 className="w-4 h-4" />}
          defaultOpen={true}
          animDelay={0.06 * (++sectionIndex)}
          badge={
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {data.relationships.length}
            </span>
          }
        >
          {data.relationships.map((rel, i) => (
            <RelationshipCard key={i} rel={rel} index={i} />
          ))}
        </CollapsibleSection>
      )}

      {/* NEW: Data Flow */}
      {data.dataFlow.length > 0 && (
        <CollapsibleSection
          label="Data Flow"
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

      {/* NEW: How It All Fits Together */}
      {data.relationshipSummary && (
        <CollapsibleSection
          label="How It All Fits Together"
          icon={<Layers className="w-4 h-4" />}
          defaultOpen={false}
          animDelay={0.06 * (++sectionIndex)}
        >
          <div className="rounded-lg bg-accent/50 border border-accent-foreground/10 px-4 py-3">
            <p className="text-sm text-foreground leading-relaxed">{data.relationshipSummary}</p>
          </div>
        </CollapsibleSection>
      )}

      {/* NEW: Context Suggestions */}
      {data.contextSuggestions.length > 0 && (
        <CollapsibleSection
          label="Context Insights"
          icon={<AlertTriangle className="w-4 h-4" />}
          defaultOpen={false}
          animDelay={0.06 * (++sectionIndex)}
          badge={
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {data.contextSuggestions.length}
            </span>
          }
        >
          {data.contextSuggestions.map((s, i) => (
            <ContextSuggestionCard key={i} suggestion={s} index={i} />
          ))}
        </CollapsibleSection>
      )}

      {/* Beginner mode */}
      <CollapsibleSection
        label="Beginner Mode"
        icon={<GraduationCap className="w-4 h-4" />}
        defaultOpen={false}
        animDelay={0.06 * (++sectionIndex)}
      >
        <div className="rounded-lg bg-sage-light/60 border border-sage-medium/30 px-4 py-3">
          <p className="text-sm text-foreground leading-relaxed">{data.beginnerMode}</p>
        </div>
      </CollapsibleSection>

      {/* Disclaimer */}
      <div className="px-5 py-2.5 border-t border-border/40 bg-muted/30">
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <Info className="w-3 h-3 shrink-0" />
          Explanations are educational and may not always be perfectly accurate.
        </p>
      </div>
    </div>
  );
};

export default ExplanationPanel;
