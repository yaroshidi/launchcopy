import { Download, FileJson, FileText, Twitter, Linkedin, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { RepoAnalysis } from "@/types/analysis";
import {
  exportAsJSON,
  exportAsMarkdown,
  copyAsTwitterThread,
  copyAsLinkedIn,
  exportSocialPosts,
  exportBlogArticles,
  exportCaseStudies,
} from "@/lib/exportUtils";

interface ExportMenuProps {
  analysis: RepoAnalysis;
}

export function ExportMenu({ analysis }: ExportMenuProps) {
  const { toast } = useToast();
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleCopy = async (type: 'twitter' | 'linkedin') => {
    const content = type === 'twitter' 
      ? copyAsTwitterThread(analysis) 
      : copyAsLinkedIn(analysis);
    
    await navigator.clipboard.writeText(content);
    setCopiedType(type);
    
    toast({
      title: "Copied to clipboard",
      description: `${type === 'twitter' ? 'Twitter thread' : 'LinkedIn post'} copied successfully`,
    });
    
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export All</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => exportAsMarkdown(analysis)}>
          <FileText className="w-4 h-4 mr-2" />
          Download as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportAsJSON(analysis)}>
          <FileJson className="w-4 h-4 mr-2" />
          Download as JSON
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Export by Type</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => exportSocialPosts(analysis)}>
          <FileText className="w-4 h-4 mr-2" />
          Social Posts (.md)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportBlogArticles(analysis)}>
          <FileText className="w-4 h-4 mr-2" />
          Blog Articles (.md)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportCaseStudies(analysis)}>
          <FileText className="w-4 h-4 mr-2" />
          Case Studies (.md)
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Copy to Clipboard</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleCopy('twitter')}>
          {copiedType === 'twitter' ? (
            <Check className="w-4 h-4 mr-2 text-primary" />
          ) : (
            <Twitter className="w-4 h-4 mr-2" />
          )}
          Copy as Twitter Thread
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCopy('linkedin')}>
          {copiedType === 'linkedin' ? (
            <Check className="w-4 h-4 mr-2 text-primary" />
          ) : (
            <Linkedin className="w-4 h-4 mr-2" />
          )}
          Copy LinkedIn Posts
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
