import { Lock, ExternalLink, Info, Key } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PrivateRepoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repoUrl: string;
}

export function PrivateRepoDialog({
  open,
  onOpenChange,
  repoUrl,
}: PrivateRepoDialogProps) {
  const repoName = repoUrl
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "");

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
            appears to be private.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mt-2 space-y-3">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Key className="w-4 h-4 text-primary shrink-0" />
            Use the "Private repo" button below the input field to add your GitHub token, then try again.
          </p>
        </div>

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
                GitHub → Personal Access Tokens
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </li>
            <li>Choose <span className="font-medium text-foreground">Tokens (classic)</span></li>
            <li>Click <span className="font-medium text-foreground">Generate new token (classic)</span></li>
            <li>
              Check the{" "}
              <span className="font-mono text-[11px] bg-secondary px-1 py-0.5 rounded text-foreground">repo</span>{" "}
              scope
            </li>
            <li>Click <span className="font-medium text-foreground">Generate token</span> and copy it</li>
          </ol>
        </div>

        <Button
          className="w-full mt-2"
          onClick={() => onOpenChange(false)}
        >
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
