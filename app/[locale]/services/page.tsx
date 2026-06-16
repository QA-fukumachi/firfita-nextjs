'use client';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/src/i18n/routing';

export default function ServicesPage() {
  const t = useTranslations('Services');
  
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

        <div className="flex flex-col gap-8 w-full pt-12 mt-4">
           <Link href="/order" className="p-8 md:p-12 border-2 border-white bg-black text-white hover:bg-white hover:text-black transition-all cursor-pointer">
              <h3 className="font-display text-3xl font-bold mb-4 uppercase tracking-widest">One-Off Vinyl Records</h3>
              <p className="opacity-80 font-light text-lg">High quality cutting of individual tracks for your DJ sets or personal collection. Fast turnaround and premium sound.</p>
           </Link>
           <Link href="/order" className="p-8 md:p-12 border-2 border-white bg-black text-white hover:bg-white hover:text-black transition-all cursor-pointer">
              <h3 className="font-display text-3xl font-bold mb-4 uppercase tracking-widest">Short Runs</h3>
              <p className="opacity-80 font-light text-lg">Need a few copies for your friends or a small promo release? We can cut short runs up to 30 copies.</p>
           </Link>
           <div className="p-8 md:p-12 border-2 border-white bg-black text-white hover:bg-white hover:text-black transition-all cursor-default">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                 <h3 className="font-display text-3xl font-bold uppercase tracking-widest">Mastering</h3>
                 <span className="font-mono text-xs tracking-widest uppercase border border-current px-3 py-1 w-fit">Coming Soon...</span>
              </div>
              <p className="opacity-80 font-light text-lg">We provide dedicated vinyl mastering to ensure your digital tracks translate perfectly to the analog realm.</p>
           </div>
        </div>
      </motion.div>
    </main>
  );
}
