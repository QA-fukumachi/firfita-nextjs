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
    title: t('pricing.title'),
    description: t('pricing.description'),
    alternates: localeAlternates(locale, '/pricing'),
    openGraph: {
      title: t('pricing.title'),
      description: t('pricing.description'),
    },
  };
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
