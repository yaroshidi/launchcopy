// Content Preferences for customization
export type ToneType = 'professional' | 'casual' | 'technical' | 'playful' | 'enterprise';
export type AudienceType = 'developers' | 'business' | 'startups' | 'enterprise' | 'general';
export type IndustryType = 'saas' | 'fintech' | 'healthcare' | 'ecommerce' | 'devtools' | 'ai-ml' | 'general';
export type VoiceType = 'formal' | 'friendly' | 'authoritative' | 'innovative';

export interface ContentPreferences {
  tone: ToneType;
  audience: AudienceType;
  industry: IndustryType;
  voice: VoiceType;
}

export const DEFAULT_PREFERENCES: ContentPreferences = {
  tone: 'professional',
  audience: 'developers',
  industry: 'general',
  voice: 'friendly',
};

export interface ContentScores {
  relevance: number;
  engagement: number;
  clarity: number;
  humanness: number;
}

export interface ProductSummary {
  name: string;
  whatItDoes: string;
  targetUsers: string[];
  keyFeatures: string[];
  valueProps: string[];
  useCases: string[];
  techStack: string[];
}

export interface SocialPost {
  platform: string;
  content: string;
  scores?: ContentScores;
}

export interface BlogArticle {
  title: string;
  content: string;
  sections?: string[];
  scores?: ContentScores;
}

export interface CaseStudy {
  title: string;
  client: string;
  industry: string;
  problem: string;
  solution: string;
  outcomes: string[];
  content: string;
  scores?: ContentScores;
}

export interface GeneratedContent {
  socialPosts: SocialPost[];
  blogArticles: BlogArticle[];
  caseStudies: CaseStudy[];
}

export interface RepoAnalysis {
  repoUrl: string;
  summary: ProductSummary;
  content: GeneratedContent;
  scenarios: string[];
  analyzedAt: Date;
  refinedAt?: Date;
}
