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
    title: t('order.title'),
    description: t('order.description'),
    alternates: localeAlternates(locale, '/order'),
    openGraph: {
      title: t('order.title'),
      description: t('order.description'),
    },
  };
}

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
