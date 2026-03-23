import { useState } from "react";
import { Play, Sparkles } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import CodeInput from "@/components/CodeInput";
import LanguageSelector from "@/components/LanguageSelector";
import MappedExplanation from "@/components/MappedExplanation";
import { Button } from "@/components/ui/button";
import { SAMPLE_CODE } from "@/lib/sampleCode";
import { generateExplanation, type CodeExplanation } from "@/lib/explanationEngine";
import { toast } from "sonner";

const Index = () => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [explanation, setExplanation] = useState<CodeExplanation | null>(null);
  const [submittedCode, setSubmittedCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUseSample = () => {
    setCode(SAMPLE_CODE[language] || SAMPLE_CODE.javascript);
    setExplanation(null);
  };

  const handleExplain = async () => {
    if (!code.trim()) {
      toast("Please paste some code first", {
        description: "The editor is empty — paste or type a code snippet to get started.",
      });
      return;
    }
    setIsLoading(true);
    setSubmittedCode(code);
    try {
      const result = await generateExplanation(code, language);
      setExplanation(result);
    } catch {
      toast.error("Something went wrong", {
        description: "We couldn't generate an explanation. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const showResults = !!explanation || isLoading;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className={`container mx-auto px-4 py-12 ${showResults ? "max-w-6xl" : "max-w-4xl"} transition-[max-width] duration-500`}>
        {/* Hero */}
        <div className="text-center mb-10 animate-fade-up">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-3 leading-[1.1]">
            Understand any code,{" "}
            <span className="text-gradient">clearly</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Paste a snippet and get a plain-language explanation — no jargon,
            no guesswork.
          </p>
        </div>

        {/* Input section */}
        <div className={`space-y-4 animate-fade-up-delay-1 ${showResults ? "max-w-4xl mx-auto" : ""}`}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <LanguageSelector value={language} onChange={setLanguage} />
            <Button variant="sage" size="sm" onClick={handleUseSample}>
              <Sparkles className="w-3.5 h-3.5" />
              Use sample code
            </Button>
          </div>

          <CodeInput
            value={code}
            onChange={(val) => {
              setCode(val);
              if (explanation) setExplanation(null);
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

        {/* Results — two-panel mapped layout */}
        <div className="mt-10">
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
