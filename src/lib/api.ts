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
    // Extract the actual error message from the response context if available
    let message = 'Failed to analyze repository';
    try {
      // FunctionsHttpError stores the response in error.context
      const ctx = (error as any).context;
      if (ctx && typeof ctx.json === 'function') {
        const body = await ctx.json();
        if (body?.error) message = body.error;
      } else if (data?.error) {
        message = data.error;
      }
    } catch {
      // fallback to generic message
    }
    throw new Error(message);
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
