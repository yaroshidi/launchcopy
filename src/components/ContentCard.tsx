import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Edit2, Save, X, Linkedin, MessageCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import type { ContentScores } from "@/types/analysis";

interface ContentCardProps {
  type: "social" | "blog" | "casestudy";
  title: string;
  content: string;
  scores?: ContentScores;
  metadata?: Record<string, any>;
  locked?: boolean;
  onRegenerate?: () => Promise<void>;
}

const XIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const platformIcons: Record<string, React.ReactNode> = {
  X: <XIcon />,
  LinkedIn: <Linkedin className="w-4 h-4" />,
  default: <MessageCircle className="w-4 h-4" />,
};

function ScoreBadge({ label, value }: { label: string; value: number }) {
  const color =
    value >= 8 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
    value >= 5 ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
    "bg-red-500/15 text-red-400 border-red-500/30";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${color}`}>
            {label.charAt(0).toUpperCase()}
            <span className="font-bold">{value}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{label}: {value}/10</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ContentCard({ type, title, content, scores, metadata, locked, onRegenerate }: ContentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  // Sync content when it changes externally (e.g. after regeneration)
  if (!isEditing && content !== editedContent && editedContent === content) {
    // already in sync
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedContent);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied successfully.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Changes saved",
      description: "Your edits have been saved.",
    });
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    setIsRegenerating(true);
    try {
      await onRegenerate();
    } catch {
      // error handled upstream
    } finally {
      setIsRegenerating(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    return platformIcons[platform] || platformIcons.default;
  };

  // Update local content when prop changes (after regeneration)
  const displayContent = isEditing ? editedContent : content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <Card className={`glass-card border-border/50 overflow-hidden group hover:border-primary/30 transition-all duration-300 ${locked ? 'relative' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {type === "social" && metadata?.platform && (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {getPlatformIcon(metadata.platform)}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {metadata?.wordCount && (
                    <span className="text-xs text-muted-foreground">
                      {metadata.wordCount} words
                    </span>
                  )}
                  {metadata?.client && (
                    <Badge variant="secondary" className="text-xs">
                      {metadata.client}
                    </Badge>
                  )}
                  {metadata?.industry && (
                    <Badge variant="outline" className="text-xs">
                      {metadata.industry}
                    </Badge>
                  )}
                  {/* Quality Scores */}
                  {scores && (
                    <>
                      <ScoreBadge label="Relevance" value={scores.relevance} />
                      <ScoreBadge label="Engagement" value={scores.engagement} />
                      <ScoreBadge label="Clarity" value={scores.clarity} />
                      {scores.humanness != null && (
                        <ScoreBadge label="Humanness" value={scores.humanness} />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            {!locked && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isEditing ? (
                  <>
                    <Button variant="ghost" size="icon" onClick={handleCancel}>
                      <X className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleSave}>
                      <Save className="w-4 h-4 text-primary" />
                    </Button>
                  </>
                ) : (
                  <>
                    {onRegenerate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRegenerate}
                        disabled={isRegenerating}
                      >
                        <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => { setEditedContent(content); setIsEditing(true); }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleCopy}>
                      {copied ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {locked ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <p className="text-sm italic">🔒 Upgrade to Pro to view this content</p>
            </div>
          ) : isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[120px] resize-none bg-secondary/30 border-primary/20 focus:border-primary"
              autoFocus
            />
          ) : type === "blog" || type === "casestudy" ? (
            <div className="prose prose-sm prose-invert max-w-none">
              {displayContent.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (trimmed.startsWith('## ')) {
                  return <h2 key={i} className="text-lg font-bold text-foreground mt-6 mb-2 first:mt-0">{trimmed.slice(3)}</h2>;
                }
                if (trimmed.startsWith('### ')) {
                  return <h3 key={i} className="text-base font-semibold text-foreground mt-4 mb-1">{trimmed.slice(4)}</h3>;
                }
                if (trimmed === '') return <br key={i} />;
                return <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-2">{trimmed}</p>;
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {displayContent}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
