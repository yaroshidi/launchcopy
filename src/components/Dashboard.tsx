import { motion } from "framer-motion";
import { ArrowLeft, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductSummary } from "@/components/ProductSummary";
import { ContentTabs } from "@/components/ContentTabs";
import { ExportMenu } from "@/components/ExportMenu";
import type { RepoAnalysis } from "@/types/analysis";

interface DashboardProps {
  analysis: RepoAnalysis;
  onBack: () => void;
}

export function Dashboard({ analysis, onBack }: DashboardProps) {
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
              <ExportMenu analysis={analysis} />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Powered by</span>
                <span className="gradient-text font-semibold text-sm">RepoToContent AI</span>
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
            <ContentTabs analysis={analysis} />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
