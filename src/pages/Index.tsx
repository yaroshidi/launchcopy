import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hero } from "@/components/Hero";
import { Dashboard } from "@/components/Dashboard";
import { generateMockAnalysis } from "@/lib/mockAnalysis";
import type { RepoAnalysis } from "@/types/analysis";

const Index = () => {
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2500));
    
    // Generate mock analysis (in real app, this would call backend AI)
    const result = generateMockAnalysis(url);
    setAnalysis(result);
    setIsLoading(false);
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
