import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const clauses = [
  {
    title: "Acceptance of Terms",
    content:
      "By creating an account or using Vault, you agree to this agreement. If you are using Vault on behalf of a team, you confirm you have authority to bind that team. If you disagree with any part of the policy, discontinue use immediately.",
  },
  {
    title: "Use of the Service",
    content:
      "Vault grants you a non-transferable license to capture ideas, run AI workflows, and manage projects for your own business or personal use. You may not reverse engineer our software, resell access, or use Vault to transmit malicious content. We reserve the right to suspend accounts that abuse our infrastructure or violate laws.",
  },
  {
    title: "Intellectual Property",
    content:
      "You retain ownership over the ideas and content you store. Vault owns the platform, visual identity, copy, training prompts, and all improvements. We request a limited license to process your content solely for providing Vault features (e.g., AI autofill, scoring, reminders).",
  },
  {
    title: "Billing & Subscriptions",
    content:
      "Paid plans renew automatically unless canceled. Cancel anytime from the Profile screen or by emailing gaureshkapoor@gmail.com before the renewal date to avoid future charges. Fees are non-refundable except where required by law.",
  },
  {
    title: "Availability & Changes",
    content:
      "We strive for 24/7 availability but may experience maintenance windows or outages. Vault may evolve over time; we can add or remove features at our discretion. If we discontinue the service, we will give reasonable notice so you can export your data.",
  },
  {
    title: "Limitation of Liability",
    content:
      "Vault is provided “as is.” To the maximum extent permitted by law, Vault and its team are not liable for indirect, incidental, or consequential damages resulting from use of the product. Our aggregate liability is limited to the fees you paid in the 3 months before a claim.",
  },
  {
    title: "Governing Law",
    content:
      "These terms are governed by the laws of Delaware, USA, without regard to conflict-of-law principles. Any disputes shall be resolved in the applicable courts located in Delaware unless mutually agreed otherwise.",
  },
];

export default function TermsConditions() {
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
          <h1 className="text-3xl font-bold">Terms & Conditions</h1>
          <p className="text-sm text-muted-foreground">
            Effective {new Date().toLocaleDateString()} — these terms describe the rules for using Vault.
          </p>
        </div>

        <div className="space-y-6">
          {clauses.map((clause) => (
            <section key={clause.title} className="bg-card border border-border rounded-2xl p-6 space-y-2">
              <h2 className="text-xl font-semibold">{clause.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{clause.content}</p>
            </section>
          ))}
        </div>

        <div className="bg-muted/40 border border-border rounded-2xl p-6 space-y-3 text-sm text-muted-foreground">
          <p>
            Questions about these terms? Email <a className="text-primary" href="mailto:gaureshkapoor@gmail.com">gaureshkapoor@gmail.com</a> or visit the Profile → Docs section in the app.
          </p>
          <div className="flex flex-wrap gap-3 text-primary">
            <Link to="/privacy" state={{ from: origin }} className="hover:underline">
              View Privacy Policy
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
