import { GraduationCap, BookOpen, Wrench } from "lucide-react";

export type DepthMode = "beginner" | "intermediate" | "advanced";

interface DepthOption {
  value: DepthMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const OPTIONS: DepthOption[] = [
  {
    value: "beginner",
    label: "Beginner",
    description: "Simple language, more context",
    icon: <GraduationCap className="w-4 h-4" />,
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Balanced and clear",
    icon: <BookOpen className="w-4 h-4" />,
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "Technical and detailed",
    icon: <Wrench className="w-4 h-4" />,
  },
];

interface DepthSelectorProps {
  value: DepthMode;
  onChange: (value: DepthMode) => void;
}

const DepthSelector = ({ value, onChange }: DepthSelectorProps) => {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/70 border border-border/50">
      {OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 active:scale-[0.97] ${
              isActive
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            }`}
            title={opt.description}
            aria-pressed={isActive}
          >
            <span className={isActive ? "text-sage" : ""}>{opt.icon}</span>
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default DepthSelector;
