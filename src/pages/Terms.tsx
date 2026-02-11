import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  useEffect(() => {
    document.title = "Terms of Service | LaunchCopy";
  }, []);

  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />
      <main className="pt-24 pb-16 px-6 md:px-10 max-w-3xl mx-auto prose prose-invert prose-sm">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 no-underline">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: February 11, 2026</p>

        <h2 className="text-foreground">1. Acceptance of Terms</h2>
        <p className="text-muted-foreground">By accessing or using LaunchCopy ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>

        <h2 className="text-foreground">2. Description of Service</h2>
        <p className="text-muted-foreground">LaunchCopy analyzes public and private GitHub repositories (with your authorization) and generates marketing content including social media posts, blog articles, and case studies using artificial intelligence.</p>

        <h2 className="text-foreground">3. User Accounts</h2>
        <p className="text-muted-foreground">You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information and to notify us immediately of any unauthorized use of your account.</p>

        <h2 className="text-foreground">4. Acceptable Use</h2>
        <p className="text-muted-foreground">You agree not to: (a) use the Service for unlawful purposes; (b) submit repositories you do not have authorization to access; (c) attempt to reverse-engineer, disrupt, or compromise the Service; (d) resell or redistribute generated content as a competing service.</p>

        <h2 className="text-foreground">5. Intellectual Property</h2>
        <p className="text-muted-foreground">You retain ownership of your repository content. Generated marketing content is provided for your use. LaunchCopy retains rights to the underlying AI models, algorithms, and platform technology.</p>

        <h2 className="text-foreground">6. Payment and Subscriptions</h2>
        <p className="text-muted-foreground">Paid plans are billed via Stripe. Subscriptions renew automatically unless cancelled. Refunds are handled on a case-by-case basis. We reserve the right to change pricing with 30 days notice.</p>

        <h2 className="text-foreground">7. Limitation of Liability</h2>
        <p className="text-muted-foreground">The Service is provided "as is" without warranties of any kind. LaunchCopy shall not be liable for any indirect, incidental, or consequential damages arising from use of the Service. Our total liability is limited to the amount you paid in the 12 months preceding the claim.</p>

        <h2 className="text-foreground">8. Termination</h2>
        <p className="text-muted-foreground">We reserve the right to suspend or terminate your access for violation of these terms. You may cancel your account at any time.</p>

        <h2 className="text-foreground">9. Changes to Terms</h2>
        <p className="text-muted-foreground">We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the new terms.</p>

        <h2 className="text-foreground">10. Contact</h2>
        <p className="text-muted-foreground">For questions about these terms, please contact us through the application.</p>
      </main>
    </div>
  );
}
