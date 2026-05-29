'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/src/i18n/routing';
import { Disc, Clock, Music, ArrowRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const t = useTranslations('Home');
  const pathname = usePathname();

  useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <main key={pathname} className="w-full flex flex-col items-center">
      
      {/* SECTION 1: HERO */}
      <section 
        className="relative w-full h-screen flex flex-col items-center justify-center gap-16 pt-32 pb-16 px-6 border-b-2 border-white"
        style={{
          backgroundImage: "linear-gradient(to bottom, rgba(10,10,10,0.3), rgba(10,10,10,0.9)), url('https://res.cloudinary.com/dqm1d4yua/image/upload/v1779882570/ChatGPT_Image_May_27_2026_03_49_09_PM_larl1p.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex justify-center"
        >
          <img 
            src="https://res.cloudinary.com/dqm1d4yua/image/upload/v1779886591/ChatGPT_Image_May_27_2026_03_38_54_PM_yorufq.png" 
            alt="FIRFITA Logo" 
            className="h-40 md:h-64 lg:h-80 w-auto object-contain opacity-90"
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-6 w-full max-w-4xl"
        >
          <h2 className="font-display text-lg md:text-xl tracking-widest text-muted uppercase">
            {t('heroSubtitle')}
          </h2>
          
          <div className="flex gap-4 md:gap-8 justify-center">
            {['7', '10', '12'].map((size) => (
              <Link href="/order" key={size} className="w-16 h-16 md:w-24 md:h-24 border-2 border-white flex items-center justify-center bg-black text-white hover:bg-white hover:text-black transition-all cursor-pointer">
                <span className="font-display text-xl md:text-3xl font-bold">{t(`sizes.${size}`)}</span>
              </Link>
            ))}
          </div>

          <Link 
            href="/order"
            className="mt-2 bg-accent-red text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-display font-bold tracking-widest text-sm md:text-base hover:scale-105 hover:bg-white hover:text-black transition-all duration-300"
          >
            {t('startOrder')}
          </Link>
        </motion.div>
      </section>

      {/* SECTION 2: SERVICE */}
      <section className="w-full border-b-2 border-white">
        <div className="max-w-6xl mx-auto py-32 px-6 flex flex-col items-center text-center gap-16">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center gap-8 w-full max-w-7xl px-4"
          >
            <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight leading-none uppercase md:whitespace-nowrap text-center">
              {t('service.title')}
            </h2>
            <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto text-left mt-6">
              <p className="text-2xl md:text-3xl text-white leading-relaxed font-light border-l-4 border-white pl-6 py-2">
                {t('service.p1')}
              </p>
              <p className="text-2xl md:text-3xl text-white leading-relaxed font-light border-l-4 border-white pl-6 py-2">
                {t('service.p2')}
              </p>
              <p className="text-2xl md:text-3xl text-white leading-relaxed font-light border-l-4 border-white pl-6 py-2">
                {t('service.p3')}
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full mt-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="flex flex-col items-center text-center gap-4"
            >
              <Disc className="w-10 h-10 mb-2" />
              <h3 className="font-display text-2xl font-bold tracking-widest uppercase">{t('service.blocks.oneOff.title')}</h3>
              <p className="text-muted font-mono text-xs tracking-widest lowercase">{t('service.blocks.oneOff.desc')}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center text-center gap-4"
            >
              <Clock className="w-10 h-10 mb-2" />
              <h3 className="font-display text-2xl font-bold tracking-widest uppercase">{t('service.blocks.fast.title')}</h3>
              <p className="text-muted font-mono text-xs tracking-widest lowercase">{t('service.blocks.fast.desc')}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center text-center gap-4"
            >
              <Music className="w-10 h-10 mb-2" />
              <h3 className="font-display text-2xl font-bold tracking-widest uppercase">{t('service.blocks.formats.title')}</h3>
              <p className="text-muted font-mono text-xs tracking-widest lowercase">{t('service.blocks.formats.desc')}</p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex justify-center w-full"
          >
            <Link href="/services" className="font-mono text-sm tracking-widest uppercase flex items-center gap-2 hover:text-accent-red transition-colors">
              {t('service.viewAllServices')} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* SECTION 3: COLLABORATIONS */}
      <section className="w-full bg-surface/10 border-b-2 border-white">
        <div className="max-w-7xl mx-auto py-32 px-6 flex flex-col gap-16">
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight uppercase text-center break-words">
            {t('collab.title')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {/* Mocking 4 collab tiles */}
            {[1, 2, 3, 4].map((i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 0.98 }}
                className="aspect-square bg-surface rounded-xl overflow-hidden cursor-pointer relative group"
              >
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="font-display tracking-widest border border-white px-6 py-2 rounded-full">VIEW</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: ABOUT US */}
      <section id="about" className="w-full border-b-2 border-white">
        <div className="max-w-4xl mx-auto py-32 px-6 text-center flex flex-col gap-8">
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight uppercase break-words">{t('about.title')}</h2>
          <p className="text-2xl md:text-3xl leading-relaxed text-muted font-light">
            {t('about.body')}
          </p>
        </div>
      </section>

      {/* SECTION 5: CONTACT US */}
      <section id="contact" className="w-full py-32 px-6 bg-accent-red text-white text-center flex flex-col gap-8">
        <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight uppercase break-words">{t('contact.title')}</h2>
        <div className="flex flex-col gap-2 font-display text-2xl md:text-4xl lg:text-5xl tracking-widest break-words">
          <a href={`mailto:${t('contact.email')}`} className="hover:opacity-80 transition-opacity">{t('contact.email')}</a>
          <a href={`tel:${t('contact.phone')}`} className="hover:opacity-80 transition-opacity">{t('contact.phone')}</a>
        </div>
      </section>

    </main>
  );
}
