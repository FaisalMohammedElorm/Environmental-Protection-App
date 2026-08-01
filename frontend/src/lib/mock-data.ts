export type ReportSeverity = "low" | "moderate" | "high" | "critical";

export interface ReportPreview {
  id: string;
  category: string;
  location: string;
  coords: string;
  severity: ReportSeverity;
  status: "new" | "assigned" | "resolved";
  reportedAt: string;
}

export const recentReports: ReportPreview[] = [
  {
    id: "EA-24817",
    category: "Illegal dumping",
    location: "Awoshie, Accra",
    coords: "5.5946°N, 0.2669°W",
    severity: "high",
    status: "assigned",
    reportedAt: "14 min ago"
  },
  {
    id: "EA-24812",
    category: "Blocked drain",
    location: "Kumasi Central",
    coords: "6.6885°N, 1.6244°W",
    severity: "moderate",
    status: "new",
    reportedAt: "38 min ago"
  },
  {
    id: "EA-24799",
    category: "Bush fire",
    location: "Damongo Outskirts",
    coords: "9.0833°N, 1.8167°W",
    severity: "critical",
    status: "assigned",
    reportedAt: "1 hr ago"
  },
  {
    id: "EA-24781",
    category: "Water pollution",
    location: "Chemu Lagoon, Tema",
    coords: "5.6698°N, 0.0166°E",
    severity: "high",
    status: "resolved",
    reportedAt: "3 hrs ago"
  }
];

export const impactStats = [
  { label: "Reports filed", value: "18,204" },
  { label: "Resolved this month", value: "1,342" },
  { label: "Active officers", value: "96" },
  { label: "Avg. response time", value: "6.4 hrs" }
];

export const howItWorks = [
  {
    step: "01",
    title: "Spot it, log it",
    body: "Snap a photo, drop a pin, describe what you see. Takes under a minute, even offline."
  },
  {
    step: "02",
    title: "Officer verifies",
    body: "A local environmental officer reviews the report, checks severity, and confirms it's actionable."
  },
  {
    step: "03",
    title: "Work gets assigned",
    body: "Verified reports route to the right team, with a due date and a public status update."
  },
  {
    step: "04",
    title: "You see it resolved",
    body: "You get notified the moment your report is closed, with photo proof of the fix."
  }
];

export const features = [
  {
    title: "GPS-tagged reporting",
    body: "Every report carries an exact coordinate, so no location gets lost in translation."
  },
  {
    title: "Photo evidence",
    body: "Attach multiple photos per report; officers can request more if needed."
  },
  {
    title: "Live status tracking",
    body: "Follow a report from new to resolved with timestamped updates."
  },
  {
    title: "Role-based dashboards",
    body: "Citizens, officers, and admins each get a workspace built for their job."
  },
  {
    title: "Heat-map analytics",
    body: "Admins spot recurring hotspots by category, ward, and season."
  },
  {
    title: "Email + in-app alerts",
    body: "Nobody has to refresh a page to know their report moved forward."
  }
];

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string;
  readMinutes: number;
  content: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "why-response-time-matters",
    title: "Why response time is the metric that actually matters",
    excerpt:
      "Report counts look impressive on a dashboard, but they don't tell you whether a hazard actually got fixed. Response time does.",
    category: "Product",
    author: "EcoAlert Team",
    publishedAt: "2026-06-02",
    readMinutes: 4,
    content: [
      "It's tempting to lead with total reports filed — it's a big, satisfying number. But a report that sits open for six weeks isn't a win, no matter how many others got filed alongside it.",
      "We track average response time per category and per district because it surfaces the bottlenecks that report counts hide. A spike in flooding reports with a slow average response tells a very different story than the same spike with a fast one.",
      "Districts that watch this number closely tend to staff differently during rainy season, and it shows in the outcomes."
    ]
  },
  {
    slug: "designing-for-offline-first-reporting",
    title: "Designing a reporting flow that works with patchy signal",
    excerpt:
      "Most environmental hazards aren't spotted somewhere with great reception. Here's how we designed around that.",
    category: "Engineering",
    author: "EcoAlert Team",
    publishedAt: "2026-05-14",
    readMinutes: 6,
    content: [
      "A blocked drain outside a shop, a bush fire on the edge of a district — the places people need to report from are rarely the places with strong signal.",
      "We kept the report form to the minimum viable fields, compress images client-side before upload, and queue submissions locally so a dropped connection doesn't mean a lost report.",
      "It's not glamorous work, but it's the difference between a feature that works in a demo and one that works in the field."
    ]
  },
  {
    slug: "a-quarter-of-cleanup-data",
    title: "What a quarter of cleanup data told us",
    excerpt:
      "Illegal dumping wasn't the most common category — but it was the slowest to resolve. Here's what the numbers showed.",
    category: "Insights",
    author: "EcoAlert Team",
    publishedAt: "2026-04-22",
    readMinutes: 5,
    content: [
      "Blocked drains were the single most-reported category this quarter, but the fastest to close — often within a day.",
      "Illegal dumping told the opposite story: fewer reports, but the longest average time to resolution, largely because of the coordination needed between sanitation and enforcement teams.",
      "That gap is now shaping how we think about cross-team assignment for the next product cycle."
    ]
  }
];

export const testimonials = [
  {
    quote:
      "We used to hear about a dump site weeks after it started smelling. Now we see it the same day, with a photo and a pin.",
    name: "Ama Owusu",
    role: "Environmental Officer, Kumasi Metro"
  },
  {
    quote:
      "I reported a blocked drain outside my shop and watched it go from new to fixed in four days. I could actually see the process.",
    name: "Kwesi Boateng",
    role: "Citizen reporter, Accra"
  },
  {
    quote:
      "The category and heat-map breakdowns changed how we plan quarterly cleanup budgets.",
    name: "Grace Mensah",
    role: "District Administrator"
  }
];
