import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FeaturesShowcase } from "@/components/FeaturesShowcase";
import { PricingSection } from "@/components/PricingSection";
import { FAQSection } from "@/components/FAQSection";
import { Footer } from "@/components/Footer";
import { Dashboard } from "@/components/Dashboard";
import { AnalyzingOverlay } from "@/components/AnalyzingOverlay";
import { PrivateRepoDialog } from "@/components/PrivateRepoDialog";
import { analyzeRepository, saveAnalysis, loadUserAnalyses } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { RepoAnalysis, ContentPreferences } from "@/types/analysis";

/** Delays rendering of the AnalyzingOverlay so fast-fail errors (like private repo 422s)
 *  never flash a full-screen overlay. */
function DelayedOverlay({ repoUrl }: { repoUrl: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return <AnalyzingOverlay repoUrl={repoUrl} />;
}

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
  const [privateRepoOpen, setPrivateRepoOpen] = useState(false);
  
  const { toast } = useToast();
  const { user, tier, isPro, isPaid, refreshSubscription } = useAuth();

  const runAnalysis = async (url: string, githubToken?: string, preferences?: ContentPreferences) => {
    const result = await analyzeRepository(url, githubToken, preferences);
    setAnalysis(result);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      analysis: result,
      repoUrl: url,
      preferences,
    }));

    // Auto-save to user account if logged in
    if (user) {
      try {
        const id = await saveAnalysis(result, preferences);
        setAnalysis((prev) => prev ? { ...prev, id } : prev);
      } catch {
        // Auto-save is best-effort
      }
    }
  };

  const handleAnalyze = async (url: string, githubToken?: string, preferences?: ContentPreferences) => {
    // Scan limits by tier: free=1, starter=5, pro=unlimited
    if (user && !isPro) {
      try {
        const existing = await loadUserAnalyses();
        const limit = tier === 'starter' ? 5 : 1;
        if (existing.length >= limit) {
          toast({
            title: "Scan limit reached",
            description: tier === 'starter'
              ? "Starter accounts are limited to 5 scans. Upgrade to Pro for unlimited scans."
              : "Free accounts are limited to 1 scan. Upgrade to get more scans.",
            variant: "destructive",
          });
          return;
        }
      } catch { /* allow scan if check fails */ }
    }

    setIsLoading(true);
    setCurrentRepoUrl(url);
    setLastPreferences(preferences);
    
    try {
      await runAnalysis(url, githubToken, preferences);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      const lowerMsg = msg.toLowerCase();
      const isRepoAccessError =
        lowerMsg.includes("private") ||
        lowerMsg.includes("could not access") ||
        lowerMsg.includes("does not have access") ||
        lowerMsg.includes("cannot access") ||
        lowerMsg.includes("token") ||
        lowerMsg.includes("fine-grained");

      if (isRepoAccessError) {
        // Don't clear the saved token – just prompt the user to check/update it
        setPrivateRepoOpen(true);
      } else {
        toast({
          title: "Analysis Failed",
          description: msg || "Failed to analyze repository. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  // Handle checkout success - refresh subscription
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success' && user) {
      window.history.replaceState({}, '', window.location.pathname);
      toast({ title: "Subscription activated!", description: "Your plan is now active. Enjoy your expanded access!" });
      refreshSubscription();
    }
  }, [user]);


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
            {isLoading && !privateRepoOpen && <DelayedOverlay repoUrl={currentRepoUrl} />}

            <FeaturesShowcase />
            <PricingSection />
            <FAQSection />
            <Footer />
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

      <PrivateRepoDialog
        open={privateRepoOpen}
        onOpenChange={setPrivateRepoOpen}
        repoUrl={currentRepoUrl}
      />
    </div>
  );
};

export default Index;
