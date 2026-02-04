import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, FileText, BookOpen, RefreshCw, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/ContentCard";
import type { RepoAnalysis } from "@/types/analysis";

interface ContentTabsProps {
  analysis: RepoAnalysis;
}

export function ContentTabs({ analysis }: ContentTabsProps) {
  const [activeTab, setActiveTab] = useState("social");
  const [regenerating, setRegenerating] = useState<string | null>(null);

  const handleRegenerate = async (type: string) => {
    setRegenerating(type);
    // Simulate regeneration - in real app, this would call AI
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRegenerating(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Generated Content</h2>
          <p className="text-muted-foreground">
            AI-generated marketing content based on repository analysis
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-secondary/50 p-1 rounded-xl">
          <TabsTrigger
            value="social"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-soft"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Social Posts
          </TabsTrigger>
          <TabsTrigger
            value="blog"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-soft"
          >
            <FileText className="w-4 h-4 mr-2" />
            Blog Articles
          </TabsTrigger>
          <TabsTrigger
            value="casestudies"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-soft"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Case Studies
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="social" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">
                  {analysis.content.socialPosts.length} posts generated
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegenerate("social")}
                  disabled={regenerating === "social"}
                >
                  {regenerating === "social" ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Regenerate All
                </Button>
              </div>
              {analysis.content.socialPosts.map((post, index) => (
                <ContentCard
                  key={index}
                  type="social"
                  title={post.platform}
                  content={post.content}
                  metadata={{ platform: post.platform }}
                />
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="blog" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">
                  {analysis.content.blogArticles.length} articles generated
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegenerate("blog")}
                  disabled={regenerating === "blog"}
                >
                  {regenerating === "blog" ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Regenerate All
                </Button>
              </div>
              {analysis.content.blogArticles.map((article, index) => (
                <ContentCard
                  key={index}
                  type="blog"
                  title={article.title}
                  content={article.content}
                  metadata={{ wordCount: article.content.split(" ").length }}
                />
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="casestudies" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">
                  {analysis.content.caseStudies.length} case studies generated
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegenerate("casestudies")}
                  disabled={regenerating === "casestudies"}
                >
                  {regenerating === "casestudies" ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Regenerate All
                </Button>
              </div>
              {analysis.content.caseStudies.map((study, index) => (
                <ContentCard
                  key={index}
                  type="casestudy"
                  title={study.title}
                  content={study.content}
                  metadata={{
                    client: study.client,
                    industry: study.industry,
                  }}
                />
              ))}
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
