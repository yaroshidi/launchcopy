import { useState, useEffect } from "react";
import { Github, ArrowRight, Loader2, Key, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent } from
"@/components/ui/popover";
import { TONE_OPTIONS, AUDIENCE_OPTIONS, INDUSTRY_OPTIONS, VOICE_OPTIONS } from "@/components/ContentPreferences";
import type { ContentPreferences as PreferencesType } from "@/types/analysis";
import { DEFAULT_PREFERENCES } from "@/types/analysis";

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

  useEffect(() => {
    if (prefillUrl) setUrl(prefillUrl);
  }, [prefillUrl]);

  const [githubToken, setGithubToken] = useState(() => {
    return localStorage.getItem("github_token") || "";
  });

  // Re-sync token state when loading finishes (error handler may have cleared localStorage)
  useEffect(() => {
    if (!isLoading) {
      const stored = localStorage.getItem("github_token") || "";
      if (stored !== githubToken && !stored) {
        setGithubToken("");
      }
    }
  }, [isLoading]);
  const [showToken, setShowToken] = useState(false);
  const [preferences, setPreferences] = useState<PreferencesType>(DEFAULT_PREFERENCES);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      if (githubToken) {
        localStorage.setItem("github_token", githubToken);
      }
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

      {/* Private repo toggle - directly below analyze */}
      <div className="flex flex-col gap-3 items-center justify-evenly float-right">
        <button
          type="button"
          onClick={() => setShowToken(!showToken)}
          disabled={isLoading}
          className={`text-xs px-2 py-0.5 rounded-full border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          showToken ?
          "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20" :
          "bg-secondary/60 text-muted-foreground border-border/30 hover:border-primary/50 hover:bg-primary/10"}`
          }>

          <span className="flex items-center gap-1">
            <Key className="w-3 h-3" />
            {showToken ? "Hide token" : "Private repo"}
          </span>
        </button>

        {/* Token input */}
        {showToken &&
        <>
            <div className="w-full flex items-center gap-2 p-2 rounded-xl glass-card border border-border/50">
              <div className="flex items-center gap-3 pl-4">
                <Key className="w-4 h-4 text-muted-foreground" />
              </div>
              <Input
              type="password"
              placeholder="GitHub Personal Access Token (optional)"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-foreground placeholder:text-muted-foreground/60"
              disabled={isLoading} />

              {githubToken &&
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setGithubToken("");
                localStorage.removeItem("github_token");
              }}
              className="text-xs text-muted-foreground">

                  Clear
                </Button>
            }
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Token is stored locally and sent securely. Create one at GitHub Settings.
            </p>
          </>
        }
      </div>

      {/* Preference chips with dropdowns */}
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
    </form>);

}