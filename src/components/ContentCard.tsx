import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Edit2, Save, X, Twitter, Linkedin, MessageCircle, RefreshCw } from "lucide-react";
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
  onRegenerate?: () => Promise<void>;
}

const platformIcons: Record<string, React.ReactNode> = {
  Twitter: <Twitter className="w-4 h-4" />,
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

export function ContentCard({ type, title, content, scores, metadata, onRegenerate }: ContentCardProps) {
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
      <Card className="glass-card border-border/50 overflow-hidden group hover:border-primary/30 transition-all duration-300">
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
                    </>
                  )}
                </div>
              </div>
            </div>
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
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[120px] resize-none bg-secondary/30 border-primary/20 focus:border-primary"
              autoFocus
            />
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
