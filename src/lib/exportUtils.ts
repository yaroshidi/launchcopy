import type { RepoAnalysis } from "@/types/analysis";

// Download helper
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export as JSON
export function exportAsJSON(analysis: RepoAnalysis) {
  const content = JSON.stringify(analysis, null, 2);
  const repoName = analysis.repoUrl.split('/').pop() || 'analysis';
  downloadFile(content, `${repoName}-analysis.json`, 'application/json');
}

// Export as Markdown bundle
export function exportAsMarkdown(analysis: RepoAnalysis) {
  const repoName = analysis.repoUrl.split('/').pop() || 'analysis';
  
  let markdown = `# ${analysis.summary.name} - Marketing Content\n\n`;
  markdown += `> Generated from: ${analysis.repoUrl}\n`;
  markdown += `> Date: ${analysis.analyzedAt.toLocaleDateString()}\n\n`;
  
  // Product Summary
  markdown += `## Product Summary\n\n`;
  markdown += `**What it does:** ${analysis.summary.whatItDoes}\n\n`;
  
  markdown += `### Target Users\n`;
  analysis.summary.targetUsers.forEach(user => {
    markdown += `- ${user}\n`;
  });
  markdown += '\n';
  
  markdown += `### Key Features\n`;
  analysis.summary.keyFeatures.forEach(feature => {
    markdown += `- ${feature}\n`;
  });
  markdown += '\n';
  
  markdown += `### Value Propositions\n`;
  analysis.summary.valueProps.forEach(prop => {
    markdown += `- ${prop}\n`;
  });
  markdown += '\n';
  
  markdown += `### Use Cases\n`;
  analysis.summary.useCases.forEach(useCase => {
    markdown += `- ${useCase}\n`;
  });
  markdown += '\n';
  
  markdown += `### Tech Stack\n`;
  markdown += analysis.summary.techStack.join(', ') + '\n\n';
  
  // Social Posts
  markdown += `---\n\n## Social Posts\n\n`;
  analysis.content.socialPosts.forEach((post, i) => {
    markdown += `### ${post.platform} Post ${i + 1}\n\n`;
    markdown += `\`\`\`\n${post.content}\n\`\`\`\n\n`;
  });
  
  // Blog Articles
  markdown += `---\n\n## Blog Articles\n\n`;
  analysis.content.blogArticles.forEach((article) => {
    markdown += `### ${article.title}\n\n`;
    markdown += `${article.content}\n\n`;
  });
  
  // Case Studies
  markdown += `---\n\n## Case Studies\n\n`;
  analysis.content.caseStudies.forEach((study) => {
    markdown += `### ${study.title}\n\n`;
    markdown += `**Client:** ${study.client}\n`;
    markdown += `**Industry:** ${study.industry}\n\n`;
    markdown += `**Problem:** ${study.problem}\n\n`;
    markdown += `**Solution:** ${study.solution}\n\n`;
    markdown += `**Outcomes:**\n`;
    study.outcomes.forEach(outcome => {
      markdown += `- ${outcome}\n`;
    });
    markdown += `\n${study.content}\n\n`;
  });
  
  downloadFile(markdown, `${repoName}-content.md`, 'text/markdown');
}

// Copy Twitter thread format
export function copyAsTwitterThread(analysis: RepoAnalysis): string {
  const tweets = analysis.content.socialPosts
    .filter(post => post.platform.toLowerCase() === 'twitter')
    .map((post, i) => `${i + 1}/ ${post.content}`);
  
  if (tweets.length === 0) {
    return "No Twitter posts available";
  }
  
  return tweets.join('\n\n');
}

// Copy LinkedIn format
export function copyAsLinkedIn(analysis: RepoAnalysis): string {
  const posts = analysis.content.socialPosts
    .filter(post => post.platform.toLowerCase() === 'linkedin');
  
  if (posts.length === 0) {
    return "No LinkedIn posts available";
  }
  
  return posts.map(p => p.content).join('\n\n---\n\n');
}

// Export social posts only
export function exportSocialPosts(analysis: RepoAnalysis) {
  const repoName = analysis.repoUrl.split('/').pop() || 'analysis';
  
  let content = `# Social Posts for ${analysis.summary.name}\n\n`;
  
  const byPlatform = analysis.content.socialPosts.reduce((acc, post) => {
    const platform = post.platform.toLowerCase();
    if (!acc[platform]) acc[platform] = [];
    acc[platform].push(post.content);
    return acc;
  }, {} as Record<string, string[]>);
  
  Object.entries(byPlatform).forEach(([platform, posts]) => {
    content += `## ${platform.charAt(0).toUpperCase() + platform.slice(1)}\n\n`;
    posts.forEach((post, i) => {
      content += `### Post ${i + 1}\n\`\`\`\n${post}\n\`\`\`\n\n`;
    });
  });
  
  downloadFile(content, `${repoName}-social-posts.md`, 'text/markdown');
}

// Export blog articles only
export function exportBlogArticles(analysis: RepoAnalysis) {
  const repoName = analysis.repoUrl.split('/').pop() || 'analysis';
  
  let content = `# Blog Articles for ${analysis.summary.name}\n\n`;
  
  analysis.content.blogArticles.forEach((article, i) => {
    content += `---\n\n## ${article.title}\n\n`;
    content += `${article.content}\n\n`;
  });
  
  downloadFile(content, `${repoName}-blog-articles.md`, 'text/markdown');
}

// Export case studies only
export function exportCaseStudies(analysis: RepoAnalysis) {
  const repoName = analysis.repoUrl.split('/').pop() || 'analysis';
  
  let content = `# Case Studies for ${analysis.summary.name}\n\n`;
  
  analysis.content.caseStudies.forEach((study) => {
    content += `---\n\n## ${study.title}\n\n`;
    content += `| Field | Value |\n|-------|-------|\n`;
    content += `| Client | ${study.client} |\n`;
    content += `| Industry | ${study.industry} |\n\n`;
    content += `### Problem\n${study.problem}\n\n`;
    content += `### Solution\n${study.solution}\n\n`;
    content += `### Outcomes\n`;
    study.outcomes.forEach(outcome => {
      content += `- ${outcome}\n`;
    });
    content += `\n### Full Story\n${study.content}\n\n`;
  });
  
  downloadFile(content, `${repoName}-case-studies.md`, 'text/markdown');
}
