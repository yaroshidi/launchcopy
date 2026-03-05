import { supabase } from "@/integrations/supabase/client";
import type { RepoAnalysis, ContentPreferences, ProductSummary } from "@/types/analysis";

export async function analyzeRepository(
  repoUrl: string,
  githubToken?: string,
  preferences?: ContentPreferences
): Promise<RepoAnalysis> {
  const { data, error } = await supabase.functions.invoke('analyze-repo', {
    body: { repoUrl, githubToken, preferences }
  });

  if (error) {
    let message = 'Failed to analyze repository';
    try {
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
    throw new Error(data.error);
  }

  return {
    ...data,
    analyzedAt: new Date(data.analyzedAt),
    refinedAt: data.refinedAt ? new Date(data.refinedAt) : undefined,
  } as RepoAnalysis;
}

// ── Save & Load analyses ────────────────────────────────

export async function saveAnalysis(
  analysis: RepoAnalysis,
  preferences?: ContentPreferences
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('analyses' as any)
    .insert({
      user_id: user.id,
      repo_url: analysis.repoUrl,
      summary: analysis.summary as any,
      content: analysis.content as any,
      scenarios: analysis.scenarios as any,
      preferences: (preferences || null) as any,
      readme_accuracy: (analysis.readmeAccuracy || null) as any,
      analyzed_at: analysis.analyzedAt.toISOString(),
      refined_at: analysis.refinedAt?.toISOString() || null,
    } as any)
    .select('id')
    .single();

  if (error) {
    throw new Error('Failed to save analysis');
  }
  return (data as any).id;
}

export async function loadUserAnalyses(): Promise<
  Array<{ id: string; repoUrl: string; summary: ProductSummary; content: any; analyzedAt: Date }>
> {
  const { data, error } = await supabase
    .from('analyses' as any)
    .select('id, repo_url, summary, content, analyzed_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return [];
  }

  return ((data as any[]) || []).map((row: any) => ({
    id: row.id,
    repoUrl: row.repo_url,
    summary: row.summary as ProductSummary,
    content: row.content,
    analyzedAt: new Date(row.analyzed_at),
  }));
}

export async function loadTrashedAnalyses(): Promise<
  Array<{ id: string; repoUrl: string; summary: ProductSummary; content: any; analyzedAt: Date; deletedAt: Date }>
> {
  const { data, error } = await supabase
    .from('analyses' as any)
    .select('id, repo_url, summary, content, analyzed_at, deleted_at')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
    .limit(50);

  if (error) {
    return [];
  }

  return ((data as any[]) || []).map((row: any) => ({
    id: row.id,
    repoUrl: row.repo_url,
    summary: row.summary as ProductSummary,
    content: row.content,
    analyzedAt: new Date(row.analyzed_at),
    deletedAt: new Date(row.deleted_at),
  }));
}

export async function loadAnalysisById(id: string): Promise<RepoAnalysis | null> {
  const { data, error } = await supabase
    .from('analyses' as any)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as any;

  return {
    id: row.id,
    repoUrl: row.repo_url,
    summary: row.summary,
    content: row.content,
    scenarios: row.scenarios || [],
    analyzedAt: new Date(row.analyzed_at),
    refinedAt: row.refined_at ? new Date(row.refined_at) : undefined,
    readmeAccuracy: row.readme_accuracy,
  };
}

/** Soft-delete: moves to trash */
export async function deleteAnalysis(id: string): Promise<void> {
  const { error } = await supabase
    .from('analyses' as any)
    .update({ deleted_at: new Date().toISOString() } as any)
    .eq('id', id);

  if (error) {
    throw new Error('Failed to delete analysis');
  }
}

/** Restore from trash */
export async function restoreAnalysis(id: string): Promise<void> {
  const { error } = await supabase
    .from('analyses' as any)
    .update({ deleted_at: null } as any)
    .eq('id', id);

  if (error) {
    throw new Error('Failed to restore analysis');
  }
}

/** Permanently delete */
export async function permanentlyDeleteAnalysis(id: string): Promise<void> {
  const { error } = await supabase
    .from('analyses' as any)
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Failed to permanently delete analysis');
  }
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
  const { data, error } = await supabase.functions.invoke('regenerate-content', {
    body: request,
  });

  if (error) {
    throw new Error(error.message || 'Failed to regenerate content');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data.items || [];
}
