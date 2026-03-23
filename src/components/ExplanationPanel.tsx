import { Lightbulb, List, AlertCircle, BookOpen } from "lucide-react";

interface ExplanationSection {
  icon: React.ReactNode;
  title: string;
  content: string;
}

interface ExplanationPanelProps {
  sections: ExplanationSection[] | null;
  isLoading?: boolean;
}

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
    <div className="w-14 h-14 rounded-2xl bg-sage-light flex items-center justify-center mb-5">
      <Lightbulb className="w-6 h-6 text-sage" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">
      Your explanation will appear here
    </h3>
    <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
      Paste some code above and click "Explain this code" to get a clear,
      beginner-friendly breakdown of what it does.
    </p>
  </div>
);

const LoadingSkeleton = () => (
  <div className="space-y-6 p-6 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className="space-y-3">
        <div className="h-5 w-32 bg-muted rounded-md" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded-md" />
          <div className="h-4 w-4/5 bg-muted rounded-md" />
        </div>
      </div>
    ))}
  </div>
);

const ExplanationPanel = ({ sections, isLoading }: ExplanationPanelProps) => {
  if (isLoading) {
    return (
      <div className="surface-elevated rounded-xl border border-border">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!sections) {
    return (
      <div className="surface-elevated rounded-xl border border-border/60">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="surface-elevated rounded-xl border border-border overflow-hidden">
      <div className="border-b border-border/60 px-6 py-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-sage" />
          Explanation
        </h2>
      </div>
      <div className="divide-y divide-border/40">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className="px-6 py-5 animate-fade-up"
            style={{ animationDelay: `${idx * 0.08}s` }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-sage-light flex items-center justify-center shrink-0 mt-0.5">
                {section.icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-foreground text-sm mb-1.5">
                  {section.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {section.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExplanationPanel;
export type { ExplanationSection };
export { EmptyState };
