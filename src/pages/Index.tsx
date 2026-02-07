import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FeaturesShowcase } from "@/components/FeaturesShowcase";
import { PricingSection } from "@/components/PricingSection";
import { FAQSection } from "@/components/FAQSection";
import { Dashboard } from "@/components/Dashboard";
import { AnalyzingOverlay } from "@/components/AnalyzingOverlay";
import { analyzeRepository } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { RepoAnalysis, ContentPreferences } from "@/types/analysis";

const STORAGE_KEY = 'repo_analysis';

const restoreSaved = () => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.analysis.analyzedAt = new Date(parsed.analysis.analyzedAt);
      if (parsed.analysis.refinedAt) {
        parsed.analysis.refinedAt = new Date(parsed.analysis.refinedAt);
      }
      return parsed as { analysis: RepoAnalysis; repoUrl: string; preferences?: ContentPreferences };
    }
  } catch { /* ignore corrupt data */ }
  return null;
};

const Index = () => {
  const saved = restoreSaved();
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(saved?.analysis ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRepoUrl, setCurrentRepoUrl] = useState(saved?.repoUrl ?? "");
  const [lastPreferences, setLastPreferences] = useState<ContentPreferences | undefined>(saved?.preferences);
  const { toast } = useToast();

  const handleAnalyze = async (url: string, githubToken?: string, preferences?: ContentPreferences) => {
    setIsLoading(true);
    setCurrentRepoUrl(url);
    setLastPreferences(preferences);
    
    try {
      const result = await analyzeRepository(url, githubToken, preferences);
      setAnalysis(result);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        analysis: result,
        repoUrl: url,
        preferences,
      }));
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze repository. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />
      <AnimatePresence mode="wait">
        {!analysis ? (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <Hero onAnalyze={handleAnalyze} isLoading={isLoading} />
            {isLoading && <AnalyzingOverlay repoUrl={currentRepoUrl} />}

            <FeaturesShowcase />
            <PricingSection />
            <FAQSection />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard analysis={analysis} preferences={lastPreferences} onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
