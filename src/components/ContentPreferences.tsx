import { Settings2, Sparkles } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ContentPreferences as Preferences,
  ToneType,
  AudienceType,
  IndustryType,
  VoiceType,
} from "@/types/analysis";

interface ContentPreferencesProps {
  preferences: Preferences;
  onChange: (preferences: Preferences) => void;
  disabled?: boolean;
}

export const TONE_OPTIONS: { value: ToneType; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Polished and business-appropriate' },
  { value: 'casual', label: 'Casual', description: 'Friendly and approachable' },
  { value: 'technical', label: 'Technical', description: 'Detailed and developer-focused' },
  { value: 'playful', label: 'Playful', description: 'Fun and creative' },
  { value: 'enterprise', label: 'Enterprise', description: 'Formal and corporate' },
];

export const AUDIENCE_OPTIONS: { value: AudienceType; label: string; description: string }[] = [
  { value: 'developers', label: 'Developers', description: 'Software engineers and technical users' },
  { value: 'business', label: 'Business Decision Makers', description: 'CTOs, VPs, and managers' },
  { value: 'startups', label: 'Startups', description: 'Founders and early-stage teams' },
  { value: 'enterprise', label: 'Enterprise', description: 'Large organizations and teams' },
  { value: 'general', label: 'General Public', description: 'Non-technical audience' },
];

export const INDUSTRY_OPTIONS: { value: IndustryType; label: string }[] = [
  { value: 'general', label: 'General / Any' },
  { value: 'saas', label: 'SaaS' },
  { value: 'fintech', label: 'Fintech' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'devtools', label: 'Developer Tools' },
  { value: 'ai-ml', label: 'AI / Machine Learning' },
];

export const VOICE_OPTIONS: { value: VoiceType; label: string; description: string }[] = [
  { value: 'formal', label: 'Formal', description: 'Traditional and structured' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and conversational' },
  { value: 'authoritative', label: 'Authoritative', description: 'Expert and confident' },
  { value: 'innovative', label: 'Innovative', description: 'Forward-thinking and cutting-edge' },
];

export function ContentPreferences({ preferences, onChange, disabled }: ContentPreferencesProps) {
  const updatePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    onChange({ ...preferences, [key]: value });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <Settings2 className="w-4 h-4" />
          <span>Customize content style</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96" align="start">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Content Preferences</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Tone */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Tone</label>
            <Select
              value={preferences.tone}
              onValueChange={(value) => updatePreference('tone', value as ToneType)}
              disabled={disabled}
            >
              <SelectTrigger className="bg-secondary/50 border-border/50 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Audience */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Target Audience</label>
            <Select
              value={preferences.audience}
              onValueChange={(value) => updatePreference('audience', value as AudienceType)}
              disabled={disabled}
            >
              <SelectTrigger className="bg-secondary/50 border-border/50 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Industry */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Industry Focus</label>
            <Select
              value={preferences.industry}
              onValueChange={(value) => updatePreference('industry', value as IndustryType)}
              disabled={disabled}
            >
              <SelectTrigger className="bg-secondary/50 border-border/50 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brand Voice */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Brand Voice</label>
            <Select
              value={preferences.voice}
              onValueChange={(value) => updatePreference('voice', value as VoiceType)}
              disabled={disabled}
            >
              <SelectTrigger className="bg-secondary/50 border-border/50 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
