import { supabase } from "@/integrations/supabase/client";
import type { RepoAnalysis } from "@/types/analysis";

export async function analyzeRepository(repoUrl: string, githubToken?: string): Promise<RepoAnalysis> {
  console.log('Calling analyze-repo edge function for:', repoUrl);
  
  const { data, error } = await supabase.functions.invoke('analyze-repo', {
    body: { repoUrl, githubToken }
  });

  if (error) {
    console.error('Edge function error:', error);
    throw new Error(error.message || 'Failed to analyze repository');
  }

  if (data?.error) {
    console.error('Analysis error:', data.error);
    throw new Error(data.error);
  }

  // Convert analyzedAt string to Date
  return {
    ...data,
    analyzedAt: new Date(data.analyzedAt)
  } as RepoAnalysis;
}
