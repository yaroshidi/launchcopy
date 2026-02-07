import { useState, useEffect } from "react";
import { Lock, Key, ExternalLink, ArrowRight, Loader2, Info, AlertCircle } from "lucide-react";
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
  errorMessage?: string;
}

export function PrivateRepoDialog({
  open,
  onOpenChange,
  repoUrl,
  onSubmitToken,
  isLoading,
  errorMessage,
}: PrivateRepoDialogProps) {
  const [token, setToken] = useState(() => localStorage.getItem("github_token") || "");

  // Clear stale token when an error is shown (means the previous token was bad)
  useEffect(() => {
    if (errorMessage) {
      setToken("");
    }
  }, [errorMessage]);

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

        {errorMessage && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive whitespace-pre-line">{errorMessage}</p>
          </div>
        )}

        <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 mt-2 space-y-2.5">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-primary shrink-0" />
            How to create a token
          </p>
          <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside ml-0.5">
            <li>
              Go to{" "}
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=LaunchCopy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5"
              >
                GitHub → Settings → Developer Settings → Personal Access Tokens
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </li>
            <li>Choose <span className="font-medium text-foreground">Tokens (classic)</span></li>
            <li>Click <span className="font-medium text-foreground">Generate new token (classic)</span></li>
            <li>
              Under scopes, check{" "}
              <span className="font-mono text-[11px] bg-secondary px-1 py-0.5 rounded text-foreground">repo</span>{" "}
              (Full control of private repositories)
            </li>
            <li>Click <span className="font-medium text-foreground">Generate token</span> and copy it</li>
          </ol>
          <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Your token is stored locally in your browser only — never sent to our servers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 mt-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Paste your token
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
          </div>

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
        </form>
      </DialogContent>
    </Dialog>
  );
}
