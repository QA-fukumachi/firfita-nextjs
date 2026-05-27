'use client';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/src/i18n/routing';

export default function PricingPage() {
  const t = useTranslations('Pricing');
  
  return (
    <main className="w-full flex flex-col items-center pt-32 pb-16 px-6 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl flex flex-col gap-12 mt-16"
      >
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-widest uppercase">{t('title')}</h1>
          <p className="text-xl text-muted font-light">{t('desc')}</p>
        </div>

        <div className="flex flex-col gap-8 w-full border-t border-white/10 pt-12 mt-8">
           <h2 className="font-display text-2xl tracking-widest uppercase text-muted">{t('sizes')}</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {['7', '10', '12'].map((size) => (
                <Link href="/order" key={size} className="p-8 border-2 border-white flex flex-col items-center justify-center text-center gap-4 bg-black text-white hover:bg-white hover:text-black transition-all aspect-square cursor-pointer">
                   <span className="font-display text-4xl md:text-5xl font-bold">{size}"</span>
                   <span className="font-bold text-xl md:text-2xl mt-2">100 GEL</span>
                </Link>
              ))}
           </div>
        </div>

      </motion.div>
    </main>
  );
}
