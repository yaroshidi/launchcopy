import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, FileText, BookOpen, RefreshCw, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/ContentCard";
import type { RepoAnalysis } from "@/types/analysis";
import type { ContentType } from "@/lib/api";

interface ContentTabsProps {
  analysis: RepoAnalysis;
  onRegenerateAll: (contentType: ContentType) => Promise<void>;
  onRegenerateItem: (contentType: ContentType, itemIndex: number) => Promise<void>;
}

export function ContentTabs({ analysis, onRegenerateAll, onRegenerateItem }: ContentTabsProps) {
  const [activeTab, setActiveTab] = useState("social");
  const [regenerating, setRegenerating] = useState<string | null>(null);

  const handleRegenerate = async (type: ContentType) => {
    setRegenerating(type);
    try {
      await onRegenerateAll(type);
    } catch {
      // error is handled in Dashboard
    } finally {
      setRegenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Generated Content</h2>
          <p className="text-muted-foreground">
            AI-generated marketing content with two-pass refinement & quality scoring
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
                  key={`social-${index}-${post.content.slice(0, 20)}`}
                  type="social"
                  title={post.platform}
                  content={post.content}
                  scores={post.scores}
                  metadata={{ platform: post.platform }}
                  onRegenerate={() => onRegenerateItem("social", index)}
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
                  key={`blog-${index}-${article.title.slice(0, 20)}`}
                  type="blog"
                  title={article.title}
                  content={article.content}
                  scores={article.scores}
                  metadata={{ wordCount: article.content.split(" ").length }}
                  onRegenerate={() => onRegenerateItem("blog", index)}
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
                  key={`case-${index}-${study.title.slice(0, 20)}`}
                  type="casestudy"
                  title={study.title}
                  content={study.content}
                  scores={study.scores}
                  metadata={{
                    client: study.client,
                    industry: study.industry,
                  }}
                  onRegenerate={() => onRegenerateItem("casestudies", index)}
                />
              ))}
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
