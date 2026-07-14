import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { localeAlternates } from '@/src/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: t('services.title'),
    description: t('services.description'),
    alternates: localeAlternates(locale, '/services'),
    openGraph: {
      title: t('services.title'),
      description: t('services.description'),
    },
  };
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
