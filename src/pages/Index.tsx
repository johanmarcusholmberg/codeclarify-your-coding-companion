import { useState } from "react";
import { Play, Sparkles, Lightbulb, List, AlertCircle } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import CodeInput from "@/components/CodeInput";
import LanguageSelector from "@/components/LanguageSelector";
import ExplanationPanel from "@/components/ExplanationPanel";
import type { ExplanationSection } from "@/components/ExplanationPanel";
import { Button } from "@/components/ui/button";
import { SAMPLE_CODE, MOCK_EXPLANATION } from "@/lib/sampleCode";

const ICONS = [
  <Lightbulb className="w-4 h-4 text-sage" />,
  <List className="w-4 h-4 text-sage" />,
  <AlertCircle className="w-4 h-4 text-sage" />,
  <Sparkles className="w-4 h-4 text-sage" />,
];

const Index = () => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [explanation, setExplanation] = useState<ExplanationSection[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUseSample = () => {
    setCode(SAMPLE_CODE[language] || SAMPLE_CODE.javascript);
    setExplanation(null);
  };

  const handleExplain = () => {
    if (!code.trim()) return;
    setIsLoading(true);
    // Simulate explanation generation
    setTimeout(() => {
      setExplanation(
        MOCK_EXPLANATION.map((s, i) => ({
          ...s,
          icon: ICONS[i % ICONS.length],
        }))
      );
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container max-w-4xl mx-auto px-4 py-12">
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
        <div className="space-y-4 animate-fade-up-delay-1">
          {/* Controls row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <LanguageSelector value={language} onChange={setLanguage} />
            <Button variant="sage" size="sm" onClick={handleUseSample}>
              <Sparkles className="w-3.5 h-3.5" />
              Use sample code
            </Button>
          </div>

          {/* Code editor */}
          <CodeInput
            value={code}
            onChange={(val) => {
              setCode(val);
              setExplanation(null);
            }}
            placeholder={SAMPLE_CODE[language] || SAMPLE_CODE.javascript}
          />

          {/* CTA */}
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleExplain}
              disabled={!code.trim() || isLoading}
            >
              <Play className="w-4 h-4" />
              Explain this code
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="mt-10 animate-fade-up-delay-3">
          <ExplanationPanel sections={explanation} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
};

export default Index;
