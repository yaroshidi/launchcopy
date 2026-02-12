import { useState, useEffect } from "react";
import { Github, ArrowRight, Loader2, Key, X, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent } from
"@/components/ui/popover";
import { TONE_OPTIONS, AUDIENCE_OPTIONS, INDUSTRY_OPTIONS, VOICE_OPTIONS } from "@/components/ContentPreferences";
import type { ContentPreferences as PreferencesType } from "@/types/analysis";
import { DEFAULT_PREFERENCES } from "@/types/analysis";
import { useAuth } from "@/contexts/AuthContext";

interface RepoInputProps {
  onAnalyze: (url: string, githubToken?: string, preferences?: PreferencesType) => void;
  isLoading: boolean;
  prefillUrl?: string;
}

function getLabel(value: string, options: {value: string;label: string;}[]): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function RepoInput({ onAnalyze, isLoading, prefillUrl }: RepoInputProps) {
  const [url, setUrl] = useState("");
  const { githubToken, setGithubToken } = useAuth();
  const [tokenInput, setTokenInput] = useState(githubToken);

  useEffect(() => {
    if (prefillUrl) setUrl(prefillUrl);
  }, [prefillUrl]);

  // Sync local input when context token changes (e.g. on login)
  useEffect(() => {
    setTokenInput(githubToken);
  }, [githubToken]);

  // Re-sync token state when loading finishes (error handler may have cleared sessionStorage)
  useEffect(() => {
    if (!isLoading) {
      const stored = sessionStorage.getItem("github_token") || "";
      if (!stored && githubToken) {
        setGithubToken("");
      }
    }
  }, [isLoading]);

  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [preferences, setPreferences] = useState<PreferencesType>(DEFAULT_PREFERENCES);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url.trim(), githubToken || undefined, preferences);
    }
  };

  const isValidGithubUrl = (url: string) => {
    return url.includes("github.com/") && url.split("/").length >= 4;
  };

  const [openChip, setOpenChip] = useState<string | null>(null);

  const chips = [
  { key: 'tone' as const, label: 'Tone', options: TONE_OPTIONS, current: preferences.tone },
  { key: 'audience' as const, label: 'Audience', options: AUDIENCE_OPTIONS, current: preferences.audience },
  { key: 'industry' as const, label: 'Industry', options: INDUSTRY_OPTIONS, current: preferences.industry },
  { key: 'voice' as const, label: 'Voice', options: VOICE_OPTIONS, current: preferences.voice }];


  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <div className="relative flex items-center gap-2 p-2 rounded-2xl glass-card border border-border/50 focus-within:border-primary/50 focus-within:shadow-glow transition-all duration-300">
        <div className="flex items-center gap-3 pl-4">
          <Github className="w-5 h-5 text-muted-foreground" />
        </div>
        <Input
          type="url"
          placeholder="https://github.com/owner/repository"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base text-foreground placeholder:text-muted-foreground/60"
          disabled={isLoading} />

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          disabled={isLoading || !url.trim() || !isValidGithubUrl(url)}
          className="rounded-xl">

          {isLoading ?
          <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </> :

          <>
              Analyze
              <ArrowRight className="w-4 h-4" />
            </>
          }
        </Button>
      </div>

      {/* Preference chips + Private repo in one row */}
      <div className="flex items-center justify-between gap-2">
        {/* Preference chips */}
        <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => {
          const isDefault = chip.current === DEFAULT_PREFERENCES[chip.key];
          const label = getLabel(chip.current, chip.options);
          return (
            <Popover
              key={chip.key}
              open={openChip === chip.key}
              onOpenChange={(open) => setOpenChip(open ? chip.key : null)}>

              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={isLoading}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ${
                  isDefault ?
                  "bg-secondary/60 text-muted-foreground border-border/30 hover:border-primary/50 hover:bg-primary/10" :
                  "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"}`
                  }>

                  <span>{label}</span>
                  {!isDefault &&
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreferences({ ...preferences, [chip.key]: DEFAULT_PREFERENCES[chip.key] });
                    }}
                    className="hover:text-destructive">

                      <X className="w-3 h-3" />
                    </span>
                  }
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="start">
                <div className="flex flex-col">
                  {chip.options.map((option) =>
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setPreferences({ ...preferences, [chip.key]: option.value });
                      setOpenChip(null);
                    }}
                    className={`text-left text-xs px-3 py-2 rounded-md transition-colors ${
                    chip.current === option.value ?
                    "bg-primary/10 text-primary font-medium" :
                    "text-foreground hover:bg-secondary"}`
                    }>

                      <div>{option.label}</div>
                      {'description' in option &&
                    <div className="text-[10px] text-muted-foreground mt-0.5">{(option as any).description}</div>
                    }
                    </button>
                  )}
                  {!isDefault &&
                  <>
                      <div className="h-px bg-border my-1" />
                      <button
                      type="button"
                      onClick={() => {
                        setPreferences({ ...preferences, [chip.key]: DEFAULT_PREFERENCES[chip.key] });
                        setOpenChip(null);
                      }}
                      className="text-left text-xs px-3 py-2 rounded-md text-muted-foreground hover:bg-secondary transition-colors">

                        Reset to default
                      </button>
                    </>
                  }
                </div>
              </PopoverContent>
            </Popover>);

        })}
        </div>

        {/* Private repo button */}
        <button
          type="button"
          onClick={() => {
            setTokenInput(githubToken);
            setTokenDialogOpen(true);
          }}
          disabled={isLoading}
          className={`text-xs px-2 py-0.5 rounded-full border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
          githubToken ?
          "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20" :
          "bg-secondary/60 text-muted-foreground border-border/30 hover:border-primary/50 hover:bg-primary/10"}`
          }>
          <span className="flex items-center gap-1">
            <Key className="w-3 h-3" />
            Private repo
            {githubToken && <Check className="w-3 h-3 text-green-500" />}
          </span>
        </button>
      </div>

      {/* Token entry dialog */}
      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Private Repository Access</DialogTitle>
            <DialogDescription className="text-center">
              Enter a GitHub Personal Access Token with <span className="font-mono text-[11px] bg-secondary px-1 py-0.5 rounded text-foreground">repo</span> scope to analyze private repositories. Your token is saved to your account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <Input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ExternalLink className="w-3 h-3 shrink-0" />
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=LaunchCopy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Create a token on GitHub
              </a>
            </p>
          </div>

          <div className="flex gap-2 mt-2">
            {githubToken && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setGithubToken("");
                  setTokenInput("");
                  setTokenDialogOpen(false);
                }}
              >
                Remove token
              </Button>
            )}
            <Button
              variant="gradient"
              className="flex-1"
              onClick={() => {
                setGithubToken(tokenInput);
                setTokenDialogOpen(false);
              }}
            >
              {tokenInput ? "Save token" : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>);

}
