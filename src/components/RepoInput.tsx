import { useState } from "react";
import { Github, ArrowRight, Loader2, Key, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContentPreferences } from "@/components/ContentPreferences";
import type { ContentPreferences as PreferencesType } from "@/types/analysis";
import { DEFAULT_PREFERENCES } from "@/types/analysis";

interface RepoInputProps {
  onAnalyze: (url: string, githubToken?: string, preferences?: PreferencesType) => void;
  isLoading: boolean;
}

export function RepoInput({ onAnalyze, isLoading }: RepoInputProps) {
  const [url, setUrl] = useState("");
  const [githubToken, setGithubToken] = useState(() => {
    return localStorage.getItem("github_token") || "";
  });
  const [showToken, setShowToken] = useState(false);
  const [preferences, setPreferences] = useState<PreferencesType>(DEFAULT_PREFERENCES);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      // Save token to localStorage for convenience
      if (githubToken) {
        localStorage.setItem("github_token", githubToken);
      }
      onAnalyze(url.trim(), githubToken || undefined, preferences);
    }
  };

  const isValidGithubUrl = (url: string) => {
    return url.includes("github.com/") && url.split("/").length >= 4;
  };

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
          disabled={isLoading}
        />
        <Button
          type="submit"
          variant="gradient"
          size="lg"
          disabled={isLoading || !url.trim() || !isValidGithubUrl(url)}
          className="rounded-xl"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              Analyze
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      {/* Content Preferences */}
      <ContentPreferences 
        preferences={preferences} 
        onChange={setPreferences} 
        disabled={isLoading}
      />

      {/* Token toggle */}
      <button
        type="button"
        onClick={() => setShowToken(!showToken)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
      >
        <Key className="w-3 h-3" />
        {showToken ? "Hide" : "Have a private repo?"}
        {showToken ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Token input */}
      {showToken && (
        <div className="flex items-center gap-2 p-2 rounded-xl glass-card border border-border/50">
          <div className="flex items-center gap-3 pl-4">
            <Key className="w-4 h-4 text-muted-foreground" />
          </div>
          <Input
            type="password"
            placeholder="GitHub Personal Access Token (optional)"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-foreground placeholder:text-muted-foreground/60"
            disabled={isLoading}
          />
          {githubToken && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setGithubToken("");
                localStorage.removeItem("github_token");
              }}
              className="text-xs text-muted-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {showToken 
          ? "Token is stored locally & sent securely. Create one at GitHub → Settings → Developer settings → Personal access tokens"
          : "Paste any public GitHub repository URL to get started"
        }
      </p>
    </form>
  );
}
