import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "Data We Collect",
    content:
      "We collect the content you provide (ideas, notes, inbox thoughts), basic account details (email, display name), and product usage analytics so we can keep Vault running reliably. We never sell personal data and only use trusted infrastructure providers such as Supabase, Vercel, and Apple/Google for platform services.",
  },
  {
    title: "How We Use Your Data",
    content:
      "Idea content stays private to your account. We use limited, anonymized snippets when sending requests to our AI providers strictly to fulfil requested actions like autofill, scoring, or chat. Operational metadata helps us secure accounts, prevent abuse, and understand which workflows to improve.",
  },
  {
    title: "AI Processing",
    content:
      "When you trigger AI features, we send only the minimum context required to OpenRouter and the selected underlying model. Providers act as processors on our behalf and are contractually prohibited from training on or retaining your prompts beyond what is necessary for the response.",
  },
  {
    title: "Your Controls",
    content:
      "You can export ideas at any time, delete individual entries, or request a full account deletion from the Profile screen. Inbox thoughts are stored locally on your device; clearing browser storage permanently removes them. For assistance, contact gaureshkapoor@gmail.com.",
  },
  {
    title: "Security Measures",
    content:
      "Vault relies on Supabase authentication, row-level security, and encrypted connections (HTTPS/TLS) end-to-end. Access to production data is limited to the founding team. We regularly review third-party dependencies and rotate credentials for infrastructure providers.",
  },
  {
    title: "Policy Updates",
    content:
      "We may update this policy as Vault evolves. Material changes will be announced via in-app notices or email. Continued use of the product after updates constitutes acceptance of the revised policy.",
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const location = useLocation();
  const origin = location.state?.from as string | undefined;

  const handleReturn = () => {
    if (origin === "profile") {
      navigate("/profile");
      return;
    }
    if (origin === "landing") {
      navigate("/", { state: { scrollTo: "footer" } });
      return;
    }
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <button
          onClick={handleReturn}
          className="flex items-center gap-2 text-muted-foreground/60 hover:text-foreground transition-all duration-300 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm font-medium opacity-70 group-hover:opacity-100 transition-opacity duration-300">
            Back
          </span>
        </button>
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Vault Docs</p>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">
            Effective {new Date().toLocaleDateString()} — Vault protects your ideas and data with privacy-first defaults.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="bg-card border border-border rounded-2xl p-6 space-y-2">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
            </section>
          ))}
        </div>

        <div className="bg-muted/40 border border-border rounded-2xl p-6 space-y-3 text-sm text-muted-foreground">
          <p>
            Questions about privacy or data handling? Email <a className="text-primary" href="mailto:gaureshkapoor@gmail.com">gaureshkapoor@gmail.com</a> and we will respond within 3 business days.
          </p>
          <div className="flex flex-wrap gap-3 text-primary">
            <Link to="/terms" state={{ from: origin }} className="hover:underline">
              View Terms & Conditions
            </Link>
            <Link to="/guide" state={{ from: origin }} className="hover:underline">
              How Vault Works
            </Link>
            <button onClick={handleReturn} className="hover:underline">
              Return to Vault
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
