import { useState } from "react";
import { Lock, Key, ExternalLink, ArrowRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PrivateRepoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repoUrl: string;
  onSubmitToken: (token: string) => void;
  isLoading: boolean;
}

export function PrivateRepoDialog({
  open,
  onOpenChange,
  repoUrl,
  onSubmitToken,
  isLoading,
}: PrivateRepoDialogProps) {
  const [token, setToken] = useState(() => localStorage.getItem("github_token") || "");

  const repoName = repoUrl
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      localStorage.setItem("github_token", token.trim());
      onSubmitToken(token.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Private Repository Detected</DialogTitle>
          <DialogDescription className="text-center">
            <span className="font-mono text-xs bg-secondary/80 px-2 py-0.5 rounded">
              {repoName}
            </span>{" "}
            appears to be private. A GitHub token is needed to access its contents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              GitHub Personal Access Token
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Needs <span className="font-medium text-foreground">repo</span> scope.
              Token is stored locally in your browser only.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              variant="gradient"
              disabled={!token.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Continue Analysis
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=LaunchCopy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Create a token on GitHub
            </a>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
