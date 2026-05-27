'use client';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

export default function ContactPage() {
  const t = useTranslations('Contact');
  
  return (
    <main className="w-full flex flex-col items-center pt-32 pb-16 px-6 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl flex flex-col gap-12 mt-16"
      >
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-widest uppercase">{t('title')}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 w-full border-t border-white/10 pt-12">
           <div className="flex flex-col gap-4">
              <span className="text-sm font-mono tracking-widest text-muted uppercase">Email</span>
              <a href={`mailto:${t('email')}`} className="font-display text-2xl md:text-3xl hover:text-accent-red transition-colors">{t('email')}</a>
           </div>
           <div className="flex flex-col gap-4">
              <span className="text-sm font-mono tracking-widest text-muted uppercase">Phone</span>
              <a href={`tel:${t('phone')}`} className="font-display text-2xl md:text-3xl hover:text-accent-red transition-colors">{t('phone')}</a>
           </div>
           <div className="flex flex-col gap-4 md:col-span-2">
              <span className="text-sm font-mono tracking-widest text-muted uppercase">Location</span>
              <span className="font-display text-2xl md:text-3xl">{t('address')}</span>
           </div>
        </div>
      </motion.div>
    </main>
  );
}
