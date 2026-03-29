import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Sparkles, History, X, Clock, Trash2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import CodeInput from "@/components/CodeInput";
import LanguageSelector from "@/components/LanguageSelector";
import DepthSelector from "@/components/DepthSelector";
import MappedExplanation from "@/components/MappedExplanation";
import { Button } from "@/components/ui/button";
import { SAMPLE_CODE } from "@/lib/sampleCode";
import { generateExplanation, type CodeExplanation, type DepthMode } from "@/lib/explanationEngine";
import { detectLanguage, normalizeCode } from "@/lib/languageDetector";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// History helpers
// ---------------------------------------------------------------------------

interface HistoryEntry {
  id: string;
  code: string;
  language: string;
  depth: DepthMode;
  explanation: CodeExplanation;
  timestamp: number;
}

const HISTORY_KEY = "codeclarify_history";
const MAX_HISTORY = 10;

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch { /* quota exceeded — silently skip */ }
}

function addToHistory(entry: Omit<HistoryEntry, "id" | "timestamp">): HistoryEntry[] {
  const history = loadHistory();
  const newEntry: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  // Remove duplicate of same code
  const filtered = history.filter((h) => h.code.trim() !== entry.code.trim());
  const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY);
  saveHistory(updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

const ONBOARDING_KEY = "codeclarify_onboarded";

function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return false;
  }
}

function markOnboarded() {
  try {
    localStorage.setItem(ONBOARDING_KEY, "true");
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const Index = () => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [depth, setDepth] = useState<DepthMode>("intermediate");
  const [explanation, setExplanation] = useState<CodeExplanation | null>(null);
  const [submittedCode, setSubmittedCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Load history & check onboarding on mount
  useEffect(() => {
    setHistory(loadHistory());
    if (!hasSeenOnboarding()) {
      setShowOnboarding(true);
    }
  }, []);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    markOnboarded();
  }, []);

  const handleUseSample = () => {
    setCode(SAMPLE_CODE[language] || SAMPLE_CODE.javascript);
    setExplanation(null);
    dismissOnboarding();
  };

  const handleExplain = async () => {
    if (!code.trim()) {
      toast("Please paste some code first", {
        description: "The editor is empty — paste or type a code snippet to get started.",
      });
      return;
    }
    dismissOnboarding();
    setIsLoading(true);
    const normalized = normalizeCode(code);
    setSubmittedCode(normalized);
    try {
      const result = await generateExplanation(normalized, language, depth);
      setExplanation(result);
      // Save to history
      const updated = addToHistory({ code, language, depth, explanation: result });
      setHistory(updated);
    } catch {
      toast.error("Something went wrong", {
        description: "We couldn't generate an explanation. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDepthChange = async (newDepth: DepthMode) => {
    setDepth(newDepth);
    if (explanation && submittedCode) {
      setIsLoading(true);
      try {
        const result = await generateExplanation(submittedCode, language, newDepth);
        setExplanation(result);
      } catch {
        // keep existing explanation on error
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    setCode(entry.code);
    setLanguage(entry.language);
    setDepth(entry.depth);
    setSubmittedCode(entry.code);
    setExplanation(entry.explanation);
    setShowHistory(false);
  };

  const handleClearHistory = () => {
    saveHistory([]);
    setHistory([]);
    toast.success("History cleared");
  };

  const showResults = !!explanation || isLoading;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className={`container mx-auto px-3 sm:px-4 py-6 sm:py-12 ${showResults ? "max-w-6xl" : "max-w-4xl"} transition-[max-width] duration-500`}>
        {/* Hero — compact on mobile */}
        <div className="text-center mb-6 sm:mb-10 animate-fade-up">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-2 sm:mb-3 leading-[1.15]">
            Understand any code,{" "}
            <span className="text-gradient">clearly</span>
          </h1>
          <p className="text-muted-foreground text-[13px] sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Paste a snippet and get a plain-language explanation — no jargon,
            no guesswork.
          </p>
        </div>

        {/* Onboarding hint for first-time users */}
        {showOnboarding && (
          <div className="max-w-2xl mx-auto mb-6 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <div className="relative rounded-xl border border-sage-medium/40 bg-sage-light/50 px-4 py-3.5 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-sage mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground mb-0.5">Welcome to CodeClarify! 👋</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Paste any code snippet below, choose a language, and click &ldquo;Explain this code&rdquo;. 
                  Or try the <strong>sample code</strong> button to see how it works.
                </p>
              </div>
              <button
                onClick={dismissOnboarding}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/60 transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Input section */}
        <div className={`space-y-4 animate-fade-up-delay-1 ${showResults ? "max-w-4xl mx-auto" : ""}`}>
          <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <LanguageSelector value={language} onChange={setLanguage} />
              <DepthSelector value={depth} onChange={handleDepthChange} />
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-muted-foreground"
                >
                  <History className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">History</span>
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-medium">
                    {history.length}
                  </span>
                </Button>
              )}
              <Button variant="sage" size="sm" onClick={handleUseSample}>
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Use sample code</span>
                <span className="sm:hidden">Sample</span>
              </Button>
            </div>
          </div>

          {/* History drawer */}
          {showHistory && (
            <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-up">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  Recent explanations
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleClearHistory}
                    className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => handleHistorySelect(entry)}
                    className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0 active:scale-[0.995]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate font-mono">
                          {entry.code.split("\n")[0].slice(0, 60)}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {entry.language} · {entry.depth} · {new Date(entry.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <CodeInput
            value={code}
            onChange={(val) => {
              const cleaned = normalizeCode(val);
              setCode(cleaned);
              if (explanation) setExplanation(null);
              // Auto-detect language on paste (significant change)
              if (cleaned.length > 20 && Math.abs(cleaned.length - code.length) > 10) {
                const detected = detectLanguage(cleaned);
                if (detected && detected !== language) {
                  setLanguage(detected);
                  toast("Language detected", {
                    description: `Switched to ${detected.charAt(0).toUpperCase() + detected.slice(1)}. You can change this manually.`,
                    duration: 3000,
                  });
                }
              }
            }}
            placeholder={SAMPLE_CODE[language] || SAMPLE_CODE.javascript}
          />

          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleExplain}
              disabled={isLoading}
            >
              <Play className="w-4 h-4" />
              {isLoading ? "Analyzing…" : "Explain this code"}
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="mt-8 sm:mt-10">
          <MappedExplanation
            code={submittedCode}
            data={explanation}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
