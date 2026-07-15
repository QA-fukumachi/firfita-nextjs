import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/src/i18n/routing';
import { Navbar } from '@/src/components/layout/Navbar';
import { Footer } from '@/src/components/layout/Footer';
import { SITE_URL, localeAlternates, ogLocale } from '@/src/lib/seo';
import "../globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const openSans = Open_Sans({
  variable: "--font-opensans",
  subsets: ["latin"],
});

export const runtime = 'edge';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t('home.title'),
      template: `%s — ${t('siteName')}`,
    },
    description: t('home.description'),
    alternates: localeAlternates(locale, ''),
    openGraph: {
      type: 'website',
      siteName: t('siteName'),
      locale: ogLocale(locale),
      title: t('home.title'),
      description: t('home.description'),
      images: [
        {
          url: 'https://res.cloudinary.com/dqm1d4yua/image/upload/v1779888687/Frame_21_ifabsr.png',
          alt: 'Firfita — custom vinyl record',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
    },
    icons: {
      icon: '/brand-ico.png?v=3',
    },
  };
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${montserrat.variable} ${openSans.variable} h-full antialiased overflow-x-clip scroll-smooth`}
    >
      <body className="min-h-full flex flex-col relative text-foreground overflow-x-clip">
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <div className="flex-grow flex flex-col">
            {children}
          </div>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
