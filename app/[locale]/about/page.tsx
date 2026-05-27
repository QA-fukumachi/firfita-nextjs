'use client';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

export default function AboutPage() {
  const t = useTranslations('About');
  
  return (
    <main className="w-full flex flex-col items-center pt-32 pb-16 px-6 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl flex flex-col gap-12 mt-16"
      >
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-widest uppercase">{t('title')}</h1>
        <div className="flex flex-col gap-8 text-xl md:text-2xl text-muted font-light leading-relaxed">
           <p>{t('p1')}</p>
           <p>{t('p2')}</p>
        </div>
      </motion.div>
    </main>
  );
}
