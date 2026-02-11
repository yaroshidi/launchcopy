import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  useEffect(() => {
    document.title = "Privacy Policy | LaunchCopy";
  }, []);

  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />
      <main className="pt-24 pb-16 px-6 md:px-10 max-w-3xl mx-auto prose prose-invert prose-sm">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 no-underline">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: February 11, 2026</p>

        <h2 className="text-foreground">1. Information We Collect</h2>
        <p className="text-muted-foreground">We collect: (a) account information (email, name, profile picture) when you sign up; (b) repository data you submit for analysis; (c) usage data such as pages visited and features used; (d) payment information processed securely through Stripe.</p>

        <h2 className="text-foreground">2. How We Use Your Information</h2>
        <p className="text-muted-foreground">We use your information to: (a) provide and improve the Service; (b) generate marketing content from your repositories; (c) process payments; (d) communicate with you about your account; (e) ensure security and prevent fraud.</p>

        <h2 className="text-foreground">3. Data Storage and Security</h2>
        <p className="text-muted-foreground">Your data is stored securely using industry-standard encryption. Repository content is processed temporarily for analysis and is not permanently stored beyond the generated results. GitHub tokens are stored only in your browser session and are never persisted on our servers.</p>

        <h2 className="text-foreground">4. Third-Party Services</h2>
        <p className="text-muted-foreground">We use the following third-party services: (a) Stripe for payment processing; (b) GitHub API for repository access; (c) AI services for content generation; (d) Google OAuth for authentication. Each operates under their own privacy policies.</p>

        <h2 className="text-foreground">5. Data Sharing</h2>
        <p className="text-muted-foreground">We do not sell your personal information. We share data only with service providers necessary to operate the platform, or when required by law.</p>

        <h2 className="text-foreground">6. Your Rights</h2>
        <p className="text-muted-foreground">You have the right to: (a) access your personal data; (b) request deletion of your account and data; (c) export your generated content; (d) opt out of non-essential communications. To exercise these rights, contact us through the application.</p>

        <h2 className="text-foreground">7. Cookies</h2>
        <p className="text-muted-foreground">We use essential cookies for authentication and session management. We do not use third-party tracking cookies.</p>

        <h2 className="text-foreground">8. Children's Privacy</h2>
        <p className="text-muted-foreground">The Service is not intended for users under 13 years of age. We do not knowingly collect information from children.</p>

        <h2 className="text-foreground">9. Changes to This Policy</h2>
        <p className="text-muted-foreground">We may update this policy periodically. We will notify you of significant changes via email or in-app notification.</p>

        <h2 className="text-foreground">10. Contact</h2>
        <p className="text-muted-foreground">For privacy-related questions, please contact us through the application.</p>
      </main>
    </div>
  );
}
