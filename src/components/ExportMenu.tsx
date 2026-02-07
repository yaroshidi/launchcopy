import { Download, FileJson, FileText, Linkedin, Copy, Check } from "lucide-react";
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
  copyAsXThread,
  copyAsLinkedIn,
  exportSocialPosts,
  exportBlogArticles,
  exportCaseStudies,
} from "@/lib/exportUtils";

const XIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface ExportMenuProps {
  analysis: RepoAnalysis;
}

export function ExportMenu({ analysis }: ExportMenuProps) {
  const { toast } = useToast();
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleCopy = async (type: 'x' | 'linkedin') => {
    const content = type === 'x' 
      ? copyAsXThread(analysis) 
      : copyAsLinkedIn(analysis);
    
    await navigator.clipboard.writeText(content);
    setCopiedType(type);
    
    toast({
      title: "Copied to clipboard",
      description: `${type === 'x' ? 'X thread' : 'LinkedIn post'} copied successfully`,
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
        <DropdownMenuItem onClick={() => handleCopy('x')}>
          {copiedType === 'x' ? (
            <Check className="w-4 h-4 mr-2 text-primary" />
          ) : (
            <XIcon />
          )}
          Copy as X Thread
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
