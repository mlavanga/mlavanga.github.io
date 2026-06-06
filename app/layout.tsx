import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GoogleAnalytics from "./components/GoogleAnalytics";
import { personalInfo } from "./data/content";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://mlavanga.github.io";
const TITLE = "Mario Lavanga — Health AI, Causal Inference & Biosignal Processing";
const DESCRIPTION =
  "Mario Lavanga is a Senior Research Engineer & Project Leader at Hamilton Medical working on ICU ventilation under FDA constraints. Health AI with statistical rigour: causal inference (PCMCI, Granger, Bayesian), time-series modelling, self-supervised representation learning and uncertainty quantification on physiological data.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "Mario Lavanga",
    "health AI",
    "causal inference",
    "biosignal processing",
    "ICU ventilation",
    "time-series modelling",
    "uncertainty quantification",
    "self-supervised representation learning",
    "statistical rigour",
    "Hamilton Medical",
  ],
  authors: [{ name: "Mario Lavanga", url: SITE_URL }],
  creator: "Mario Lavanga",
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Mario Lavanga",
    locale: "en_US",
    firstName: "Mario",
    lastName: "Lavanga",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Mario Lavanga",
  url: SITE_URL,
  jobTitle: "Senior Research Engineer & Project Leader",
  worksFor: { "@type": "Organization", name: "Hamilton Medical AG", url: "https://www.hamilton-medical.com/" },
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "KU Leuven" },
    { "@type": "CollegeOrUniversity", name: "Politecnico di Milano" },
  ],
  knowsAbout: [
    "Health AI",
    "Causal Inference",
    "Statistics",
    "Biosignal Processing",
    "ICU Ventilation",
    "Time-Series Modelling",
    "Uncertainty Quantification",
    "Self-Supervised Representation Learning",
  ],
  sameAs: [
    `https://www.linkedin.com/in/${personalInfo.socials.linkedin}`,
    `https://scholar.google.com/citations?user=${personalInfo.socials.scholar}`,
    `https://github.com/${personalInfo.socials.github}`,
    `https://orcid.org/${personalInfo.socials.orcid}`,
    `https://www.youtube.com/channel/${personalInfo.socials.youtube}`,
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <GoogleAnalytics gaId="G-9G7324QGDH" />
        {children}
      </body>
    </html>
  );
}
