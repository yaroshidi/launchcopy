import type { RepoAnalysis } from "@/types/analysis";

export function generateMockAnalysis(repoUrl: string): RepoAnalysis {
  const repoName = repoUrl.split("/").pop() || "Project";
  
  return {
    repoUrl,
    analyzedAt: new Date(),
    summary: {
      name: repoName.charAt(0).toUpperCase() + repoName.slice(1).replace(/-/g, " "),
      whatItDoes: "A modern, full-featured application that streamlines workflows and enhances productivity. It provides an intuitive interface for managing complex tasks while integrating seamlessly with existing tools and platforms.",
      targetUsers: [
        "Developers and engineering teams",
        "Product managers and stakeholders",
        "Small to medium businesses",
        "Enterprise organizations",
      ],
      keyFeatures: [
        "Real-time collaboration and sync",
        "Intuitive drag-and-drop interface",
        "Advanced analytics and reporting",
        "Seamless third-party integrations",
        "Role-based access control",
      ],
      valueProps: [
        "Reduce time spent on repetitive tasks by up to 60%",
        "Improve team collaboration and visibility",
        "Scale effortlessly from startup to enterprise",
        "Enterprise-grade security out of the box",
      ],
      useCases: [
        "Project planning and sprint management",
        "Cross-team coordination and communication",
        "Performance tracking and optimization",
        "Automated workflow automation",
      ],
      techStack: ["React", "TypeScript", "Node.js", "PostgreSQL", "GraphQL", "Docker"],
    },
    scenarios: [
      "A startup uses this to coordinate product development across remote teams",
      "An enterprise deploys this for company-wide project visibility",
      "A freelancer leverages this to manage multiple client projects",
    ],
    content: {
      socialPosts: [
        {
          platform: "Twitter",
          content: `🚀 Just discovered ${repoName} and it's a game-changer for team productivity!\n\n✅ Real-time collaboration\n✅ Intuitive workflows\n✅ Integrates with everything\n\nIf you're still juggling spreadsheets, you need to check this out. Your future self will thank you. 🙌\n\n#productivity #devtools #opensource`,
        },
        {
          platform: "LinkedIn",
          content: `I've been exploring ${repoName} for our team's workflow management, and I'm impressed.\n\nHere's what stands out:\n\n1️⃣ The learning curve is practically non-existent\n2️⃣ Integration with our existing stack took minutes, not days\n3️⃣ The analytics dashboard gives us insights we never had before\n\nFor teams looking to level up their project management without the enterprise price tag, this is worth a serious look.\n\nWhat tools are you using for team coordination?`,
        },
        {
          platform: "Twitter",
          content: `Hot take: Most project management tools are overengineered.\n\n${repoName} gets it right by focusing on what actually matters:\n\n→ Speed\n→ Simplicity  \n→ Flexibility\n\nNo bloat. No 100-feature checklists. Just works. ⚡`,
        },
      ],
      blogArticles: [
        {
          title: `How ${repoName} Can Transform Your Team's Workflow in 2024`,
          content: `In today's fast-paced development environment, teams need tools that adapt to their workflow—not the other way around. ${repoName} represents a new approach to project management that prioritizes developer experience without sacrificing powerful features.

**The Problem with Traditional Tools**

Most project management solutions suffer from feature bloat. They try to be everything to everyone, resulting in cluttered interfaces and steep learning curves. Teams spend more time managing the tool than actually shipping product.

**A Different Approach**

${repoName} takes a fundamentally different approach. Built by developers for developers, it focuses on the 20% of features that deliver 80% of the value. The result? A tool that feels intuitive from day one.

**Key Benefits for Your Team**

1. **Faster Onboarding**: New team members become productive in hours, not weeks
2. **Better Visibility**: Real-time dashboards give everyone the context they need
3. **Reduced Context Switching**: Deep integrations mean you can stay in your flow
4. **Scalable Architecture**: Start small and grow without hitting walls

**Getting Started**

The best part? You can try ${repoName} today with zero commitment. The open-source core means you can self-host or use the cloud version—your choice, your data.`,
        },
        {
          title: `5 Ways ${repoName} Saves Development Teams 10+ Hours Per Week`,
          content: `Time is the most precious resource for any development team. Every hour spent on administrative tasks is an hour not spent shipping features. Here's how ${repoName} helps teams reclaim their time.

**1. Automated Status Updates**

No more Monday standup meetings where everyone recites what they did last week. ${repoName} tracks progress automatically and generates summaries that actually matter.

**2. Smart Notifications**

Notification fatigue is real. ${repoName}'s intelligent notification system learns your preferences and only alerts you to things that genuinely need your attention.

**3. One-Click Integrations**

Connect your existing tools—GitHub, Slack, Jira, you name it—in seconds. No complex configuration required.

**4. Template-Based Workflows**

Don't reinvent the wheel for every project. Create templates once and deploy them with a single click.

**5. AI-Powered Insights**

Identify bottlenecks before they become blockers. ${repoName}'s analytics surface patterns that would take hours to discover manually.

**The Bottom Line**

Teams using ${repoName} report saving an average of 12 hours per week per developer. That's 3 full days of productivity recovered every month.`,
        },
      ],
      caseStudies: [
        {
          title: `How TechFlow Scaled from 5 to 50 Engineers with ${repoName}`,
          client: "TechFlow Inc.",
          industry: "SaaS / Technology",
          problem: "As TechFlow grew from a small startup to a mid-sized company, their cobbled-together project management system started falling apart. Communication gaps led to duplicate work, missed deadlines, and frustrated engineers.",
          solution: `TechFlow adopted ${repoName} as their central coordination hub, integrating it with their existing GitHub and Slack workflows.`,
          outcomes: [
            "40% reduction in meeting time",
            "75% faster onboarding for new hires",
            "Zero duplicate work incidents in 6 months",
          ],
          content: `**The Challenge**

TechFlow started like many startups—with a handful of engineers communicating over Slack and tracking work in spreadsheets. It worked fine at five people. At fifteen, cracks started showing. By the time they hit thirty engineers, the system was completely broken.

"We had three different engineers working on the same feature without knowing it," recalls Sarah Chen, TechFlow's VP of Engineering. "That was our wake-up call."

**Finding the Right Solution**

The team evaluated seven different project management tools before discovering ${repoName}. What set it apart? "It was the only tool that didn't require us to change how we work," says Chen. "Everything else wanted us to adapt to their workflow. ${repoName} adapted to ours."

**The Implementation**

Rolling out ${repoName} took just two weeks—far faster than the months-long implementations they'd heard about with other tools. The key was the native integrations with their existing stack.

**The Results**

Six months post-implementation, the numbers speak for themselves:

- Meeting time dropped by 40%, as async updates replaced synchronous standups
- New engineers became productive in days instead of weeks
- Zero incidents of duplicate work—the problem that sparked the search

"${repoName} isn't just a tool," Chen reflects. "It's become the foundation of how we operate as a team."`,
        },
        {
          title: `Creative Agency Cuts Project Delivery Time by 50% with ${repoName}`,
          client: "Pixel Perfect Studios",
          industry: "Creative / Design Agency",
          problem: "Pixel Perfect was struggling to manage multiple client projects simultaneously. Deadlines were being missed, client communication was scattered, and the team was burning out.",
          solution: `The agency implemented ${repoName} to centralize all client work, using its customizable workflows to match their creative process.`,
          outcomes: [
            "50% faster project delivery",
            "Client satisfaction scores up 35%",
            "Team overtime reduced by 60%",
          ],
          content: `**The Situation**

Pixel Perfect Studios had built a reputation for stunning design work, but behind the scenes, things weren't so pretty. The 12-person agency was juggling 20+ client projects with a patchwork of tools—Trello for tasks, email for client communication, spreadsheets for timelines.

"We were spending more time managing our tools than doing actual creative work," admits founder Jake Morrison.

**The Turning Point**

When a major client project missed its deadline—damaging a key relationship—Morrison knew something had to change. A colleague recommended ${repoName}, praising its flexibility for non-engineering teams.

**Making It Their Own**

Unlike traditional project management tools designed for software teams, ${repoName}'s customizable workflows let Pixel Perfect create processes that matched their creative phases: Discovery, Concept, Design, Refine, Deliver.

**Transformative Results**

Within three months:

- Average project delivery time dropped from 6 weeks to 3 weeks
- Client satisfaction scores jumped 35 percentage points  
- Most importantly, team members stopped working evenings and weekends

"Our clients are happier, our team is healthier, and our work is better," Morrison says. "${repoName} didn't just save our agency—it transformed it."`,
        },
      ],
    },
  };
}
