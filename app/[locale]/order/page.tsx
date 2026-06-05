'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

type Size = '7' | '10' | '12' | 'test1' | 'test15' | 'test05' | null;
type Color = 'Red' | 'Transparent' | 'Black' | null;

export default function OrderPage() {
  const t = useTranslations('Order');
  
  const [size, setSize] = useState<Size>(null);
  const [color, setColor] = useState<Color>(null);
  const [packaging, setPackaging] = useState<'blank' | 'custom'>('blank');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [info, setInfo] = useState({ name: '', lastName: '', phone: '' });
  const [stickerLink, setStickerLink] = useState('');

  const calculateTotal = () => {
    let total = 0;
    if (size === '7' || size === '10' || size === '12') total += 100;
    else if (size === 'test1') total += 1;
    else if (size === 'test15') total += 1.5;
    else if (size === 'test05') total += 0.5;
    const qty = typeof quantity === 'number' ? quantity : (parseInt(quantity) || 1);
    return total * qty;
  };

  const images = {
    Red: 'https://res.cloudinary.com/dqm1d4yua/image/upload/v1779888689/Frame_22_tsrnkq.png',
    Transparent: 'https://res.cloudinary.com/dqm1d4yua/image/upload/v1779888630/Frame_20_1_tor8yw.png',
    Black: 'https://res.cloudinary.com/dqm1d4yua/image/upload/v1779888687/Frame_21_ifabsr.png'
  };

  return (
    <div className="bg-white text-black min-h-screen w-full">
      <main className="w-full max-w-7xl mx-auto px-4 md:px-6 py-24 md:py-32 flex flex-col lg:flex-row gap-12 md:gap-16 relative">
        
        {/* LEFT: FORM FIELDS */}
        <div className="flex-grow flex flex-col gap-16">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight uppercase mb-4">{t('title')}</h1>

          {/* STEP 1: CUSTOMER INFO */}
          <section className="flex flex-col gap-6 border-2 border-black p-6 md:p-8">
            <h2 className="font-display text-xl font-bold tracking-widest text-black">{t('step1')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <input 
                type="text" 
                placeholder={t('name')}
                value={info.name}
                onChange={e => setInfo({...info, name: e.target.value})}
                className="bg-transparent border-b border-gray-300 py-3 outline-none focus:border-black transition-all text-base placeholder-gray-400"
              />
              <input 
                type="text" 
                placeholder={t('lastName')}
                value={info.lastName}
                onChange={e => setInfo({...info, lastName: e.target.value})}
                className="bg-transparent border-b border-gray-300 py-3 outline-none focus:border-black transition-all text-base placeholder-gray-400"
              />
              <input 
                type="tel" 
                placeholder={t('phone')}
                value={info.phone}
                onChange={e => setInfo({...info, phone: e.target.value})}
                className="bg-transparent border-b border-gray-300 py-3 outline-none focus:border-black transition-all text-base md:col-span-2 placeholder-gray-400"
              />
            </div>
          </section>

          {/* STEP 2: SIZE */}
          <section className="flex flex-col gap-6">
            <h2 className="font-display text-xl font-bold tracking-widest text-black">{t('step2')} <span className="text-sm lowercase font-body font-normal tracking-normal">({t('sizeHint')})</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['7', '10', '12', 'test1', 'test15', 'test05'] as Size[]).map((s) => (
                <div 
                  key={s!}
                  onClick={() => setSize(s)}
                  className={`p-6 md:p-8 cursor-pointer transition-all border-2 ${size === s ? 'border-black bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-400'}`}
                >
                  <div className="font-display text-4xl mb-4">{t(`size${s}.title`)}</div>
                  <p className="text-sm text-gray-500 mb-8 h-16">{t(`size${s}.desc`)}</p>
                  <div className="font-bold text-xl">{t(`size${s}.price`)}</div>
                </div>
              ))}
            </div>
          </section>

          {/* STEP 3: COLOR */}
          <section className="flex flex-col gap-6">
            <h2 className="font-display text-xl font-bold tracking-widest text-black">{t('step3')}</h2>
            <div className="flex flex-wrap gap-4 md:gap-8 justify-center sm:justify-start">
              {(['Black', 'Red', 'Transparent'] as Color[]).map((c) => (
                <div 
                  key={c!}
                  onClick={() => setColor(c)}
                  className="flex flex-col items-center gap-6 cursor-pointer group"
                >
                  <div className={`w-40 h-40 rounded-full flex items-center justify-center p-1 transition-all ${color === c ? 'ring-2 ring-black scale-105' : 'group-hover:scale-105'}`}>
                    {images[c!] ? (
                      <img src={images[c!]} alt={c!} className="w-full h-full rounded-full object-cover shadow-lg border border-gray-200" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#111] shadow-2xl flex items-center justify-center">
                         <div className="w-32 h-32 rounded-full border border-white/5 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full border border-white/5"></div>
                         </div>
                      </div>
                    )}
                  </div>
                  <span className={`font-display tracking-widest text-sm uppercase font-bold transition-colors ${color === c ? 'text-black' : 'text-gray-400 group-hover:text-black'}`}>{t(`color${c}`)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* STEP 4: CENTER STICKER */}
          <section className="flex flex-col gap-6">
             <h2 className="font-display text-xl font-bold tracking-widest text-black">{t('step4')}</h2>
             <div className="flex flex-col gap-2">
               <input 
                 type="text" 
                 placeholder={t('pasteLink')}
                 value={stickerLink}
                 onChange={e => setStickerLink(e.target.value)}
                 className="bg-transparent border-b border-gray-300 py-3 outline-none focus:border-black transition-all text-base w-full placeholder-gray-400"
               />
               <p className="text-sm text-gray-500 mt-2">{t('stickerFormatInfo')} <button className="font-bold underline hover:text-accent-red ml-1">{t('downloadTemplate')}</button></p>
             </div>
          </section>

        </div>

        {/* RIGHT: STICKY SUMMARY PANEL */}
        <div className="w-full lg:w-80 lg:sticky lg:top-32 self-start transition-all duration-500 ease-in-out z-10">
          <div className="p-6 bg-black text-white flex flex-col gap-6 shadow-2xl rounded-xl">
             
             <div className="flex flex-col gap-3">
                <h3 className="font-display text-lg font-bold tracking-widest">{t('step6')}</h3>
                <div className="flex items-center gap-2 border border-white/20 p-1">
                  <button 
                    onClick={() => {
                      const current = typeof quantity === 'number' ? quantity : (parseInt(quantity as string) || 1);
                      setQuantity(Math.max(1, current - 1));
                    }} 
                    className="w-10 h-10 flex items-center justify-center text-xl hover:bg-white/10"
                  >-</button>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.length > 4) return;
                      if (val === '') {
                        setQuantity('');
                      } else {
                        setQuantity(Math.max(1, parseInt(val) || 1));
                      }
                    }}
                    className="flex-grow text-center bg-transparent font-display text-xl outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button 
                    onClick={() => {
                      const current = typeof quantity === 'number' ? quantity : (parseInt(quantity as string) || 1);
                      setQuantity(current + 1);
                    }} 
                    className="w-10 h-10 flex items-center justify-center text-xl hover:bg-white/10"
                  >+</button>
                </div>
             </div>

             <hr className="border-white/20" />

             <div className="flex items-end justify-between">
                <span className="font-display tracking-widest text-gray-400">{t('summaryTitle')}</span>
                <span className="font-display text-3xl font-bold">{calculateTotal()} GEL</span>
             </div>

             <button 
               disabled={!size || !color || !info.name || !info.phone}
               className="w-full py-6 mt-4 bg-white text-black font-display font-bold tracking-widest text-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-red hover:text-white transition-all transform hover:scale-[1.02] active:scale-95"
             >
                {t('submit')}
             </button>
          </div>
        </div>

      </main>
    </div>
  );
}
