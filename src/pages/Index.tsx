import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ContentShowcase } from "@/components/ContentShowcase";
import { Dashboard } from "@/components/Dashboard";
import { AnalyzingOverlay } from "@/components/AnalyzingOverlay";
import { analyzeRepository } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { RepoAnalysis, ContentPreferences } from "@/types/analysis";

const Index = () => {
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRepoUrl, setCurrentRepoUrl] = useState("");
  const { toast } = useToast();

  const handleAnalyze = async (url: string, githubToken?: string, preferences?: ContentPreferences) => {
    setIsLoading(true);
    setCurrentRepoUrl(url);
    
    try {
      const result = await analyzeRepository(url, githubToken, preferences);
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

            <section
              id="showcase"
              className="relative px-6 md:px-10 pb-24"
            >
              <div className="max-w-3xl mx-auto space-y-6">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider"
                >
                  See what we generate
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <ContentShowcase />
                </motion.div>
              </div>
            </section>
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
