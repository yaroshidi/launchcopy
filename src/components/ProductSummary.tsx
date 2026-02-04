import { motion } from "framer-motion";
import { Users, Target, Zap, Code, Lightbulb, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RepoAnalysis } from "@/types/analysis";

interface ProductSummaryProps {
  analysis: RepoAnalysis;
}

export function ProductSummary({ analysis }: ProductSummaryProps) {
  const sections = [
    {
      icon: Target,
      title: "What It Does",
      content: analysis.summary.whatItDoes,
    },
    {
      icon: Users,
      title: "Target Users",
      content: analysis.summary.targetUsers.join(", "),
    },
    {
      icon: Zap,
      title: "Key Features",
      items: analysis.summary.keyFeatures,
    },
    {
      icon: Lightbulb,
      title: "Value Propositions",
      items: analysis.summary.valueProps,
    },
    {
      icon: Briefcase,
      title: "Use Cases",
      items: analysis.summary.useCases,
    },
  ];

  return (
    <div className="space-y-4 sticky top-24">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Code className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{analysis.summary.name}</h2>
          <p className="text-sm text-muted-foreground">Product Analysis</p>
        </div>
      </div>

      {/* Tech Stack */}
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tech Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysis.summary.techStack.map((tech) => (
              <Badge key={tech} variant="secondary" className="font-mono text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {sections.map((section, index) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <section.icon className="w-4 h-4 text-primary" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {section.content && (
                <p className="text-sm text-muted-foreground">{section.content}</p>
              )}
              {section.items && (
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
