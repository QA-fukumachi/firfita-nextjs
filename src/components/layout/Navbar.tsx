'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/src/i18n/routing';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const t = useTranslations('Navbar');
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-4 flex items-center justify-between transition-colors ${isOpen ? 'bg-black' : 'bg-background/90 backdrop-blur-md border-b border-white/10'}`}>
        {/* Left Logo */}
        <Link href="/" onClick={closeMenu} className="hover:opacity-75 transition-opacity flex items-center z-50">
          <img 
            src="https://res.cloudinary.com/dqm1d4yua/image/upload/v1779886591/ChatGPT_Image_May_27_2026_03_38_54_PM_yorufq.png" 
            alt="Firfita" 
            className="h-10 md:h-12 w-auto brightness-200 contrast-150"
          />
        </Link>

        {/* Center Links (Desktop) */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex gap-8 items-center text-sm tracking-widest font-display">
          <Link href="/" className="hover:text-accent-red transition-colors">{t('home')}</Link>
          <Link href="/about" className="hover:text-accent-red transition-colors">{t('about')}</Link>
          <Link href="/contact" className="hover:text-accent-red transition-colors">{t('contact')}</Link>
          <Link href="/pricing" className="hover:text-accent-red transition-colors">{t('pricing')}</Link>
        </div>

        {/* Right Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex gap-2 text-sm font-display">
            <Link href="/" locale="en" className="hover:text-accent-red">EN</Link>
            <span className="text-muted">/</span>
            <Link href="/" locale="ka" className="hover:text-accent-red">KA</Link>
          </div>
          <Link 
            href="/order" 
            className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm tracking-wider hover:bg-accent-red hover:text-white transition-all transform hover:scale-105"
          >
            {t('orderNow')}
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button 
          className="md:hidden z-50 text-white p-2 hover:text-accent-red transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center gap-8 font-display text-2xl tracking-widest"
          >
            <Link href="/" onClick={closeMenu} className="hover:text-accent-red transition-colors">{t('home')}</Link>
            <Link href="/about" onClick={closeMenu} className="hover:text-accent-red transition-colors">{t('about')}</Link>
            <Link href="/contact" onClick={closeMenu} className="hover:text-accent-red transition-colors">{t('contact')}</Link>
            <Link href="/pricing" onClick={closeMenu} className="hover:text-accent-red transition-colors">{t('pricing')}</Link>
            
            <Link 
              href="/order" 
              onClick={closeMenu}
              className="mt-4 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-accent-red hover:text-white transition-all"
            >
              {t('orderNow')}
            </Link>

            <div className="flex gap-6 mt-8 text-xl text-gray-400">
              <Link href="/" locale="en" onClick={closeMenu} className="hover:text-white transition-colors">EN</Link>
              <span>/</span>
              <Link href="/" locale="ka" onClick={closeMenu} className="hover:text-white transition-colors">KA</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
