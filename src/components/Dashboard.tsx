import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductSummary } from "@/components/ProductSummary";
import { ContentTabs } from "@/components/ContentTabs";
import { ExportMenu } from "@/components/ExportMenu";
import { regenerateContent, type ContentType } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { RepoAnalysis, ContentPreferences } from "@/types/analysis";

interface DashboardProps {
  analysis: RepoAnalysis;
  preferences?: ContentPreferences;
  onBack: () => void;
}

export function Dashboard({ analysis: initialAnalysis, preferences, onBack }: DashboardProps) {
  const [analysis, setAnalysis] = useState<RepoAnalysis>(initialAnalysis);
  const { user } = useAuth();
  const isUnlocked = !!user;
  const { toast } = useToast();

  const handleRegenerateAll = async (contentType: ContentType) => {
    try {
      const items = await regenerateContent({
        repoUrl: analysis.repoUrl,
        summary: analysis.summary,
        preferences,
        contentType,
      });

      setAnalysis((prev) => {
        const updated = { ...prev, content: { ...prev.content } };
        if (contentType === 'social') updated.content.socialPosts = items;
        else if (contentType === 'blog') updated.content.blogArticles = items;
        else if (contentType === 'casestudies') updated.content.caseStudies = items;
        return updated;
      });

      toast({ title: "Content regenerated", description: "Fresh content has been generated with quality scores." });
    } catch (error) {
      console.error('Regeneration failed:', error);
      toast({
        title: "Regeneration Failed",
        description: error instanceof Error ? error.message : "Failed to regenerate content.",
        variant: "destructive",
      });
      throw error; // re-throw so ContentTabs can handle loading state
    }
  };

  const handleRegenerateItem = async (contentType: ContentType, itemIndex: number) => {
    try {
      const items = await regenerateContent({
        repoUrl: analysis.repoUrl,
        summary: analysis.summary,
        preferences,
        contentType,
        itemIndex,
      });

      if (items.length > 0) {
        setAnalysis((prev) => {
          const updated = { ...prev, content: { ...prev.content } };
          if (contentType === 'social') {
            updated.content.socialPosts = [...prev.content.socialPosts];
            updated.content.socialPosts[itemIndex] = items[0];
          } else if (contentType === 'blog') {
            updated.content.blogArticles = [...prev.content.blogArticles];
            updated.content.blogArticles[itemIndex] = items[0];
          } else if (contentType === 'casestudies') {
            updated.content.caseStudies = [...prev.content.caseStudies];
            updated.content.caseStudies[itemIndex] = items[0];
          }
          return updated;
        });
        toast({ title: "Item regenerated", description: "Content has been refreshed." });
      }
    } catch (error) {
      console.error('Item regeneration failed:', error);
      toast({
        title: "Regeneration Failed",
        description: error instanceof Error ? error.message : "Failed to regenerate item.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                New Analysis
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Github className="w-5 h-5 text-muted-foreground" />
                <span className="font-mono text-sm text-muted-foreground">
                  {analysis.repoUrl.replace("https://github.com/", "")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isUnlocked && <ExportMenu analysis={analysis} />}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Powered by</span>
                <span className="gradient-text font-semibold text-sm">LaunchCopy AI</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Product Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <ProductSummary analysis={analysis} />
          </motion.div>

          {/* Right Column - Content Generation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <ContentTabs
              analysis={analysis}
              isUnlocked={isUnlocked}
              onRegenerateAll={handleRegenerateAll}
              onRegenerateItem={handleRegenerateItem}
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
