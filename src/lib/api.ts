import { supabase } from "@/integrations/supabase/client";
import type { RepoAnalysis, ContentPreferences, ProductSummary } from "@/types/analysis";

export async function analyzeRepository(
  repoUrl: string,
  githubToken?: string,
  preferences?: ContentPreferences
): Promise<RepoAnalysis> {
  console.log('Calling analyze-repo edge function for:', repoUrl);
  console.log('With preferences:', preferences);

  const { data, error } = await supabase.functions.invoke('analyze-repo', {
    body: { repoUrl, githubToken, preferences }
  });

  if (error) {
    console.error('Edge function error:', error);
    throw new Error(error.message || 'Failed to analyze repository');
  }

  if (data?.error) {
    console.error('Analysis error:', data.error);
    throw new Error(data.error);
  }

  return {
    ...data,
    analyzedAt: new Date(data.analyzedAt),
    refinedAt: data.refinedAt ? new Date(data.refinedAt) : undefined,
  } as RepoAnalysis;
}

export type ContentType = 'social' | 'blog' | 'casestudies';

export interface RegenerateRequest {
  repoUrl: string;
  summary: ProductSummary;
  preferences?: ContentPreferences;
  contentType: ContentType;
  itemIndex?: number;
}

export async function regenerateContent(request: RegenerateRequest): Promise<any[]> {
  console.log('Calling regenerate-content for:', request.contentType, 'itemIndex:', request.itemIndex);

  const { data, error } = await supabase.functions.invoke('regenerate-content', {
    body: request,
  });

  if (error) {
    console.error('Regenerate edge function error:', error);
    throw new Error(error.message || 'Failed to regenerate content');
  }

  if (data?.error) {
    console.error('Regeneration error:', data.error);
    throw new Error(data.error);
  }

  return data.items || [];
}
