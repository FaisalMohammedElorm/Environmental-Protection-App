import type { Metadata } from "next";
import { StaticPageShell } from "@/components/ui/static-page-shell";
import { Accordion } from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "FAQ — EcoAlert",
  description: "Answers to common questions about reporting, officer review, and privacy."
};

const faqs = [
  {
    question: "Do I need to create an account to report a hazard?",
    answer:
      "Yes — an account lets us notify you as your report moves from new to resolved, and lets you follow up with photos or comments if an officer needs more detail."
  },
  {
    question: "What happens after I submit a report?",
    answer:
      "An environmental officer reviews it, usually within a few hours. They can accept it and assign it to a team, or reject it if it's a duplicate or outside scope. You'll get a notification either way."
  },
  {
    question: "Can I report anonymously?",
    answer:
      "Your name isn't shown publicly, but our officers can see who filed a report so they can follow up if they need clarification or additional photos."
  },
  {
    question: "What if my location isn't accurate?",
    answer:
      "You can always edit the location description in your report, or leave a comment with more precise directions if GPS placed the pin slightly off."
  },
  {
    question: "How is my data used?",
    answer:
      "Report data — category, location, photos — is used to route and resolve your report, and in aggregate for district-level analytics. See our Privacy Policy for the full detail."
  },
  {
    question: "Can I become an environmental officer?",
    answer:
      "Officer accounts are set up by your district administrator. If you work in sanitation, forestry, or environmental enforcement, ask your admin to add you."
  }
];

export default function FaqPage() {
  return (
    <StaticPageShell
      eyebrow="FAQ"
      title="Common questions"
      subtitle="If you don't see your question here, reach out on the contact page."
    >
      <div className="mx-auto max-w-2xl">
        <Accordion items={faqs} />
      </div>
    </StaticPageShell>
  );
}
