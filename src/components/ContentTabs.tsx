import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, FileText, BookOpen, RefreshCw, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/ContentCard";
import { LockedContentOverlay } from "@/components/LockedContentOverlay";
import { UpgradePlanDialog } from "@/components/UpgradePlanDialog";
import type { SubscriptionTier } from "@/lib/tiers";
import type { RepoAnalysis } from "@/types/analysis";
import type { ContentType } from "@/lib/api";

interface ContentTabsProps {
  analysis: RepoAnalysis;
  tier: SubscriptionTier;
  onRegenerateAll: (contentType: ContentType) => Promise<void>;
  onRegenerateItem: (contentType: ContentType, itemIndex: number) => Promise<void>;
}

function getLimit(tier: SubscriptionTier): number {
  if (tier === 'pro' || tier === 'starter') return Infinity;
  return 1; // free
}

export function ContentTabs({ analysis, tier, onRegenerateAll, onRegenerateItem }: ContentTabsProps) {
  const [activeTab, setActiveTab] = useState("social");
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const isPro = tier === 'pro';

  const handleRegenerateClick = (type: ContentType) => {
    if (!isPro) {
      setUpgradeOpen(true);
      return;
    }
    handleRegenerate(type);
  };

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
          <h2 className="text-3xl md:text-4xl font-display text-foreground">Generated Content</h2>
          <p className="text-sm text-muted-foreground">
            AI-generated marketing content with two-pass refinement & quality scoring
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-secondary/50 p-1 rounded-xl">
          <TabsTrigger
            value="social"
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Social Posts
          </TabsTrigger>
          <TabsTrigger
            value="blog"
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <FileText className="w-4 h-4 mr-2" />
            Blog Articles
          </TabsTrigger>
          <TabsTrigger
            value="casestudies"
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
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
                  onClick={() => handleRegenerateClick("social")}
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
              {analysis.content.socialPosts.map((post, index) => {
                const limit = getLimit(tier);
                const locked = index >= limit;
                return (
                  <ContentCard
                    key={`social-${index}-${post.content.slice(0, 20)}`}
                    type="social"
                    title={post.platform}
                    content={post.content}
                    scores={post.scores}
                    metadata={{ platform: post.platform }}
                    locked={locked}
                    onRegenerate={isPro ? () => onRegenerateItem("social", index) : () => { setUpgradeOpen(true); return Promise.resolve(); }}
                  />
                );
              })}
              {tier === 'free' && <LockedContentOverlay />}
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
                  disabled={regenerating === "blog" || tier !== 'pro'}
                >
                  {regenerating === "blog" ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Regenerate All
                </Button>
              </div>
              {analysis.content.blogArticles.map((article, index) => {
                const limit = getLimit(tier);
                const locked = index >= limit;
                return (
                  <ContentCard
                    key={`blog-${index}-${article.title.slice(0, 20)}`}
                    type="blog"
                    title={article.title}
                    content={article.content}
                    scores={article.scores}
                    metadata={{ wordCount: article.content.split(" ").length }}
                    locked={locked}
                    onRegenerate={tier === 'pro' ? () => onRegenerateItem("blog", index) : undefined}
                  />
                );
              })}
              {tier === 'free' && <LockedContentOverlay />}
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
                  disabled={regenerating === "casestudies" || tier !== 'pro'}
                >
                  {regenerating === "casestudies" ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Regenerate All
                </Button>
              </div>
              {analysis.content.caseStudies.map((study, index) => {
                const limit = getLimit(tier);
                const locked = index >= limit;
                return (
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
                    locked={locked}
                    onRegenerate={tier === 'pro' ? () => onRegenerateItem("casestudies", index) : undefined}
                  />
                );
              })}
              {tier === 'free' && <LockedContentOverlay />}
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
