import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { ImpactStats } from "@/components/landing/impact-stats";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { RecentReports } from "@/components/landing/recent-reports";
import { MapPreview } from "@/components/landing/map-preview";
import { Testimonials } from "@/components/landing/testimonials";
import { Partners } from "@/components/landing/partners";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <ImpactStats />
      <HowItWorks />
      <Features />
      <RecentReports />
      <MapPreview />
      <Testimonials />
      <Partners />
      <Cta />
      <Footer />
    </main>
  );
}
