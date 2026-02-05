import { useState } from "react";
import { ChevronDown, ChevronUp, Settings2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

const TONE_OPTIONS: { value: ToneType; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Polished and business-appropriate' },
  { value: 'casual', label: 'Casual', description: 'Friendly and approachable' },
  { value: 'technical', label: 'Technical', description: 'Detailed and developer-focused' },
  { value: 'playful', label: 'Playful', description: 'Fun and creative' },
  { value: 'enterprise', label: 'Enterprise', description: 'Formal and corporate' },
];

const AUDIENCE_OPTIONS: { value: AudienceType; label: string; description: string }[] = [
  { value: 'developers', label: 'Developers', description: 'Software engineers and technical users' },
  { value: 'business', label: 'Business Decision Makers', description: 'CTOs, VPs, and managers' },
  { value: 'startups', label: 'Startups', description: 'Founders and early-stage teams' },
  { value: 'enterprise', label: 'Enterprise', description: 'Large organizations and teams' },
  { value: 'general', label: 'General Public', description: 'Non-technical audience' },
];

const INDUSTRY_OPTIONS: { value: IndustryType; label: string }[] = [
  { value: 'general', label: 'General / Any' },
  { value: 'saas', label: 'SaaS' },
  { value: 'fintech', label: 'Fintech' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'devtools', label: 'Developer Tools' },
  { value: 'ai-ml', label: 'AI / Machine Learning' },
];

const VOICE_OPTIONS: { value: VoiceType; label: string; description: string }[] = [
  { value: 'formal', label: 'Formal', description: 'Traditional and structured' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and conversational' },
  { value: 'authoritative', label: 'Authoritative', description: 'Expert and confident' },
  { value: 'innovative', label: 'Innovative', description: 'Forward-thinking and cutting-edge' },
];

export function ContentPreferences({ preferences, onChange, disabled }: ContentPreferencesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updatePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    onChange({ ...preferences, [key]: value });
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        <Settings2 className="w-4 h-4" />
        <span>Customize content style</span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-4 rounded-xl glass-card border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Content Preferences</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tone */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Tone</label>
                  <Select
                    value={preferences.tone}
                    onValueChange={(value) => updatePreference('tone', value as ToneType)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="bg-secondary/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Audience */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Target Audience</label>
                  <Select
                    value={preferences.audience}
                    onValueChange={(value) => updatePreference('audience', value as AudienceType)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="bg-secondary/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AUDIENCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Industry Focus</label>
                  <Select
                    value={preferences.industry}
                    onValueChange={(value) => updatePreference('industry', value as IndustryType)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="bg-secondary/50 border-border/50">
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
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Brand Voice</label>
                  <Select
                    value={preferences.voice}
                    onValueChange={(value) => updatePreference('voice', value as VoiceType)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="bg-secondary/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                These preferences will tailor the generated content to your needs
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
