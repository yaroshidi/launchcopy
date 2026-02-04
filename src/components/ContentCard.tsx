import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Edit2, Save, X, Twitter, Linkedin, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ContentCardProps {
  type: "social" | "blog" | "casestudy";
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

const platformIcons: Record<string, React.ReactNode> = {
  Twitter: <Twitter className="w-4 h-4" />,
  LinkedIn: <Linkedin className="w-4 h-4" />,
  default: <MessageCircle className="w-4 h-4" />,
};

export function ContentCard({ type, title, content, metadata }: ContentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

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

  const getPlatformIcon = (platform: string) => {
    return platformIcons[platform] || platformIcons.default;
  };

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
                {metadata && (
                  <div className="flex items-center gap-2 mt-1">
                    {metadata.wordCount && (
                      <span className="text-xs text-muted-foreground">
                        {metadata.wordCount} words
                      </span>
                    )}
                    {metadata.client && (
                      <Badge variant="secondary" className="text-xs">
                        {metadata.client}
                      </Badge>
                    )}
                    {metadata.industry && (
                      <Badge variant="outline" className="text-xs">
                        {metadata.industry}
                      </Badge>
                    )}
                  </div>
                )}
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
                  <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
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
              {editedContent}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
