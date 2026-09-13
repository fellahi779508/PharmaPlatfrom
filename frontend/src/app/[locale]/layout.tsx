import "./globals.css";
import { Inter } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import TopBar from "@/components/topBar";
import QuickNav from "@/components/dashboard/quickNav";
import ThemeScript from "@/components/dashboard/ThemeScript";
import PreferencesNav from "@/components/dashboard/preferenceNav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title:
    "Pharmacie QCM Algérie | Examens, Cours et QCMs pour Étudiants en Pharmacie",
  description:
    "La plateforme n°1 de préparation aux examens et QCMs pour les étudiants en pharmacie en Algérie. Entraînez-vous avec des QCMs corrigés, simulez vos EMDs et maîtrisez vos cours de la 1ère à la 5ème année.",
  keywords: [
    "qcm pharmacie",
    "qcm pharmacie algérie",
    "examens pharmacie algérie",
    "EMD pharmacie",
    "faculté de pharmacie oran",
    "faculté de pharmacie alger",
    "cours pharmacie algérie",
    "botanique pharmaceutique",
    "simulation examen pharmacie",
    "etudiant en pharmacie",
    "رخصة صيدلة",
    "أسئلة متعددة الخيارات صيدلة",
    "امتحانات صيدلة الجزائر",
    "محاكاة الامتحانات",
    "qcmmed",
    "qcm pharmacie dz",
  ],
  openGraph: {
    title: "Pharmacie QCM Algérie – Simulateur d'Examens & QCMs",
    description:
      "Révisez efficacement vos modules de pharmacie en Algérie. QCMs conformes aux examens EMD, corrections détaillées et suivi de progression par année.",
    url: "https://pharmacie-dz.com", // Update with your actual domain
    siteName: "Pharmacie QCM Algérie",
    locale: "fr_DZ",
    type: "website",
    images: [
      {
        url: "/images/pharmacy_thumbnail.png",
        width: 1200,
        height: 630,
        alt: "Pharmacie QCM Algérie Dashboard",
      },
    ],
  },
  icons: {
    icon: "/images/logo-pharmacy.png",
  },
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={inter.variable}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider locale={locale}>
          {/* <TopBar /> */}
          <main>{children}</main>
          <QuickNav variant="sidebar" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
