import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hero } from "@/components/Hero";
import { Dashboard } from "@/components/Dashboard";
import { analyzeRepository } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { RepoAnalysis } from "@/types/analysis";

const Index = () => {
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async (url: string, githubToken?: string) => {
    setIsLoading(true);
    
    try {
      const result = await analyzeRepository(url, githubToken);
      setAnalysis(result);
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
    setAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-background dark">
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
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard analysis={analysis} onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
