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
}

export interface BlogArticle {
  title: string;
  content: string;
  sections?: string[];
}

export interface CaseStudy {
  title: string;
  client: string;
  industry: string;
  problem: string;
  solution: string;
  outcomes: string[];
  content: string;
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
}
