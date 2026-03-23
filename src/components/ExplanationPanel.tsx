import { useState, useMemo } from "react";
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
} from "lucide-react";
import type { CodeExplanation, ExplanationItemId } from "@/lib/explanationEngine";
import { makeItemId } from "@/lib/explanationEngine";
import { useHighlight } from "@/contexts/HighlightContext";

// ---------------------------------------------------------------------------
// Section config
// ---------------------------------------------------------------------------

interface SectionConfig {
  key: keyof Omit<CodeExplanation, "summary" | "beginnerMode" | "summaryLines">;
  label: string;
  icon: React.ReactNode;
}

const SECTIONS: SectionConfig[] = [
  { key: "structure", label: "Structure", icon: <Layers className="w-4 h-4" /> },
  { key: "functions", label: "Functions", icon: <Code2 className="w-4 h-4" /> },
  { key: "variables", label: "Variables", icon: <Variable className="w-4 h-4" /> },
  { key: "logic", label: "Logic", icon: <GitBranch className="w-4 h-4" /> },
  { key: "syntax", label: "Syntax", icon: <Hash className="w-4 h-4" /> },
  { key: "suggestions", label: "Suggestions", icon: <MessageSquare className="w-4 h-4" /> },
];

// ---------------------------------------------------------------------------
// Collapsible section
// ---------------------------------------------------------------------------

interface CollapsibleSectionProps {
  label: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  animDelay: number;
}

const CollapsibleSection = ({
  label,
  icon,
  defaultOpen = false,
  children,
  animDelay,
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
        <span className="font-medium text-sm text-foreground flex-1">
          {label}
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
  const { activeItemId, highlightFromExplanation, clearHighlight } =
    useHighlight();
  const isActive = activeItemId === itemId;

  // We need the item's lines — passed via a data attribute or looked up.
  // For simplicity we store lines in a closure from the parent.
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

// Wrapper that passes lines to highlight context on hover
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
    SECTIONS.forEach((s) => {
      const items = data[s.key];
      if (items.length) {
        lines.push(`## ${s.label}`);
        items.forEach((it) => lines.push(`• ${it.label}: ${it.detail}`));
        lines.push("");
      }
    });
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
            <>
              <Check className="w-3.5 h-3.5 text-sage" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
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
            <h3 className="font-medium text-sm text-foreground mb-1">
              Summary
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Collapsible sections */}
      {SECTIONS.map((section, idx) => {
        const items = data[section.key];
        if (!items.length) return null;
        return (
          <CollapsibleSection
            key={section.key}
            label={section.label}
            icon={section.icon}
            defaultOpen={idx < 2}
            animDelay={0.06 * (idx + 1)}
          >
            {items.map((item, i) => (
              <ItemCardWrapper
                key={i}
                item={item}
                sectionKey={section.key}
                itemIndex={i}
              />
            ))}
          </CollapsibleSection>
        );
      })}

      {/* Beginner mode */}
      <CollapsibleSection
        label="Beginner Mode"
        icon={<GraduationCap className="w-4 h-4" />}
        defaultOpen={false}
        animDelay={0.06 * (SECTIONS.length + 1)}
      >
        <div className="rounded-lg bg-sage-light/60 border border-sage-medium/30 px-4 py-3">
          <p className="text-sm text-foreground leading-relaxed">
            {data.beginnerMode}
          </p>
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
