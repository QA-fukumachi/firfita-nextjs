'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

type Size = '7' | '10' | '12' | 'test1' | 'test15' | 'test05' | null;
type Color = 'Red' | 'Transparent' | 'Black' | null;

function usePersistedState<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialValue);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(key);
    if (stored) {
      try {
        setState(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
    setMounted(true);
  }, [key]);

  useEffect(() => {
    if (mounted) {
      sessionStorage.setItem(key, JSON.stringify(state));
    }
  }, [key, state, mounted]);

  return [state, setState];
}

export default function OrderPage() {
  const t = useTranslations('Order');
  
  const [size, setSize] = usePersistedState<Size>('order_size', null);
  const [color, setColor] = usePersistedState<Color>('order_color', null);
  const [packaging, setPackaging] = usePersistedState<'blank' | 'custom'>('order_packaging', 'blank');
  const [quantity, setQuantity] = usePersistedState<number | string>('order_quantity', 1);
  const [info, setInfo] = usePersistedState('order_info', { name: '', lastName: '', phone: '', email: '' });
  const [stickerType, setStickerType] = usePersistedState<'default' | 'custom'>('order_stickerType', 'default');
  const [stickerLink, setStickerLink] = usePersistedState('order_stickerLink', '');
  const [addOuterSleeve, setAddOuterSleeve] = usePersistedState<boolean>('order_addOuterSleeve', false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showDefaultStickerPreview, setShowDefaultStickerPreview] = useState(false);

  const getVinylPricing = (sz: Size, q: number) => {
    if (sz === '12') {
      if (q >= 51) return { base: 100, current: 60 };
      if (q >= 26) return { base: 100, current: 70 };
      if (q >= 11) return { base: 100, current: 80 };
      return { base: 100, current: 100 };
    }
    if (sz === '10') {
      if (q >= 51) return { base: 80, current: 60 };
      if (q >= 26) return { base: 80, current: 70 };
      return { base: 80, current: 80 };
    }
    if (sz === '7') {
      if (q >= 51) return { base: 55, current: 40 };
      if (q >= 11) return { base: 55, current: 45 };
      return { base: 55, current: 55 };
    }
    if (sz === 'test1') return { base: 1, current: 1 };
    if (sz === 'test15') return { base: 1.5, current: 1.5 };
    if (sz === 'test05') return { base: 0.5, current: 0.5 };
    
    return { base: 0, current: 0 };
  };

  const getSleevePricing = (sz: Size, osQ: number) => {
    if (sz === '12') {
      if (osQ >= 51) return { base: 20, current: 12 };
      if (osQ >= 26) return { base: 20, current: 16 };
      return { base: 20, current: 20 };
    }
    if (sz === '10') {
      if (osQ >= 51) return { base: 15, current: 8 };
      if (osQ >= 26) return { base: 15, current: 12 };
      return { base: 15, current: 15 };
    }
    if (sz === '7') {
      if (osQ >= 101) return { base: 10, current: 7 };
      if (osQ >= 26) return { base: 10, current: 8 };
      return { base: 10, current: 10 };
    }
    return { base: 0, current: 0 };
  };

  const parsedQty = typeof quantity === 'number' ? quantity : (parseInt(quantity as string) || 1);
  const parsedOsQty = addOuterSleeve ? parsedQty : 0;

  const vinylPricing = getVinylPricing(size, parsedQty);
  const sleevePricing = getSleevePricing(size, parsedOsQty);

  const calculateTotal = () => {
    let total = vinylPricing.current * parsedQty;
    
    if (sleevePricing.current > 0 && parsedOsQty > 0) {
      total += sleevePricing.current * parsedOsQty;
    }

    if (stickerType === 'custom' && (size === '12' || size === '10' || size === '7')) {
      total += 8 * parsedQty;
    }

    return total;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitResult(null);

    const payload = {
      access_key: "45e0a590-f72c-4d94-95a3-5f9cafeb5e91",
      subject: "New Order Submission - Firfita",
      "First Name": info.name,
      "Last Name": info.lastName,
      "Email": info.email,
      "Phone": info.phone,
      "Size": size,
      "Color": color,
      "Quantity": parsedQty,
      "Outer Sleeve Quantity": parsedOsQty,
      "Center Sticker": stickerType === 'custom' ? "Custom Design" : "Firfita Default",
      "Sticker Link": stickerType === 'custom' ? (stickerLink || "None provided") : "N/A",
      "Total Price": calculateTotal() + " GEL"
    };

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.status === 200) {
        setSubmitResult({ success: true, message: "Order placed successfully!" });
        // Optional: clear form after success
        setInfo({ name: '', lastName: '', phone: '', email: '' });
        setSize(null);
        setColor(null);
        setQuantity(1);
        setAddOuterSleeve(false);
        setStickerType('default');
        setStickerLink('');
        setQuantity(1);
      } else {
        setSubmitResult({ success: false, message: result.message || "Something went wrong" });
      }
    } catch (error) {
      setSubmitResult({ success: false, message: "Network error, please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const images = {
    Red: 'https://res.cloudinary.com/dqm1d4yua/image/upload/v1779888689/Frame_22_tsrnkq.png',
    Transparent: 'https://res.cloudinary.com/dqm1d4yua/image/upload/v1779888630/Frame_20_1_tor8yw.png',
    Black: 'https://res.cloudinary.com/dqm1d4yua/image/upload/v1779888687/Frame_21_ifabsr.png'
  };

  return (
    <div className="bg-white text-black min-h-screen w-full">
      {showDefaultStickerPreview && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowDefaultStickerPreview(false)}
        >
          <div className="relative w-[300px] md:w-[380px] flex flex-col items-center">
            <button 
              onClick={() => setShowDefaultStickerPreview(false)}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg backdrop-blur-md transition-all shadow-xl z-10"
            >
              ✕
            </button>
            <img 
              src="https://res.cloudinary.com/dqm1d4yua/image/upload/v1781348406/Firfita_sticker_ffb0nt.jpg" 
              alt="Firfita default Sticker" 
              className="w-full h-auto aspect-square object-cover rounded-full shadow-[0_0_60px_rgba(0,0,0,0.6)] border border-white/20"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
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
                type="email" 
                placeholder={t('email') || "Email Address"}
                value={info.email}
                onChange={e => setInfo({...info, email: e.target.value})}
                className="bg-transparent border-b border-gray-300 py-3 outline-none focus:border-black transition-all text-base placeholder-gray-400"
              />
              <input 
                type="tel" 
                placeholder={t('phone')}
                value={info.phone}
                onChange={e => setInfo({...info, phone: e.target.value})}
                className="bg-transparent border-b border-gray-300 py-3 outline-none focus:border-black transition-all text-base placeholder-gray-400"
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
                  className={`p-6 md:p-8 flex flex-col h-full cursor-pointer transition-all border-2 ${size === s ? 'border-black bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-400'}`}
                >
                  <div className="font-display text-4xl mb-4">{t(`size${s}.title`)}</div>
                  <p className="text-sm text-gray-500 mb-8">{t(`size${s}.desc`)}</p>
                  <div className="font-bold text-xl mt-auto">{t(`size${s}.price`)}</div>
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

          {/* STEP 3.5: OUTER SLEEVE */}
          <section className="flex flex-col gap-6">
            <h2 className="font-display text-xl font-bold tracking-widest text-black">{t('stepOuterSleeve')}</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-64 sm:w-72 shrink-0 flex items-center justify-center -ml-4 sm:-ml-6 -mt-10 -mb-6 sm:-mt-12 sm:-mb-10">
                <img 
                    src={
                      color === 'Red' 
                        ? 'https://res.cloudinary.com/dqm1d4yua/image/upload/v1781265617/Firefly_2_aignz7.png' 
                        : color === 'Transparent' 
                        ? 'https://res.cloudinary.com/dqm1d4yua/image/upload/v1781265617/Firefly_thjsm9.png' 
                        : 'https://res.cloudinary.com/dqm1d4yua/image/upload/v1781265617/Firefly_1_p83rm9.png'
                    } 
                    alt="Outer Sleeve" 
                    className="w-full h-auto object-contain" 
                  />
                </div>
              <div className="flex flex-col gap-3">
                <span className="font-display tracking-widest text-sm uppercase font-bold text-black flex items-center gap-2">
                  {(size === '12' || size === '10' || size === '7') && (
                    <span className={`text-xs font-bold normal-case ${sleevePricing.current < sleevePricing.base ? 'text-green-600' : 'text-gray-500'}`}>
                      {sleevePricing.current < sleevePricing.base && <span className="line-through text-gray-400 font-normal mr-1">{sleevePricing.base}</span>}
                      (+{sleevePricing.current} GEL)
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setAddOuterSleeve(!addOuterSleeve)} 
                    className={`px-6 py-2 border border-black font-display tracking-widest uppercase font-bold transition-colors ${addOuterSleeve ? 'bg-black text-white' : 'bg-transparent text-black hover:bg-black/5'}`}
                  >
                    {addOuterSleeve ? t('added') : t('addToOrder')}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* STEP 4: CENTER STICKER */}
          <section className="flex flex-col gap-6">
             <h2 className="font-display text-xl font-bold tracking-widest text-black">{t('step4')}</h2>
             <div className="flex flex-col gap-6">
               <div className="flex flex-col sm:flex-row gap-4">
                 <button 
                   onClick={() => setStickerType('default')}
                   className={`flex-1 py-4 px-6 border-2 transition-all font-display tracking-widest text-sm font-bold uppercase flex flex-col items-center justify-center ${stickerType === 'default' ? 'border-black bg-black text-white' : 'border-gray-200 text-black hover:border-black'}`}
                 >
                   {t('defaultSticker')} <span className={`block text-xs font-normal lowercase mt-1 ${stickerType === 'default' ? 'text-white/80' : 'text-gray-500'}`}>(Free)</span>
                   <span 
                      onClick={(e) => { e.stopPropagation(); setShowDefaultStickerPreview(true); }}
                      className={`mt-3 text-[10px] sm:text-xs lowercase border-b pb-0.5 cursor-pointer transition-colors ${stickerType === 'default' ? 'border-white/50 hover:border-white text-white/80' : 'border-gray-400 hover:border-black text-gray-500 hover:text-black'}`}
                    >
                      Firfita default Sticker
                    </span>
                 </button>
                 <button 
                   onClick={() => setStickerType('custom')}
                   className={`flex-1 py-4 px-6 border-2 transition-all font-display tracking-widest text-sm font-bold uppercase flex flex-col items-center justify-center ${stickerType === 'custom' ? 'border-black bg-black text-white' : 'border-gray-200 text-black hover:border-black'}`}
                 >
                   {t('customSticker')} <span className={`block text-xs font-bold normal-case mt-1 ${stickerType === 'custom' ? 'text-white/80' : 'text-gray-500'}`}>(+8 GEL)</span>
                 </button>
               </div>
               <div className="flex flex-col gap-2">
                 <input 
                   type="text" 
                   placeholder={t('pasteLink')}
                   value={stickerLink}
                   onChange={e => setStickerLink(e.target.value)}
                   disabled={stickerType === 'default'}
                   className={`bg-transparent border-b py-3 outline-none transition-all text-base w-full ${stickerType === 'default' ? 'border-gray-200 text-gray-300 placeholder-gray-200 cursor-not-allowed' : 'border-gray-300 focus:border-black text-black placeholder-gray-400'}`}
                 />
                 <p className={`text-sm mt-2 ${stickerType === 'default' ? 'text-gray-300' : 'text-gray-500'}`}>
                   {t('stickerFormatInfo')} 
                   <a 
                     href={stickerType === 'default' ? undefined : "/public%20template/Dubplate%20Sticker.jpg"}
                     download="Dubplate Sticker.jpg"
                     className={`inline-block font-bold underline ml-1 ${stickerType === 'default' ? 'cursor-not-allowed opacity-50' : 'hover:text-accent-red cursor-pointer'}`}
                     onClick={(e) => {
                       if (stickerType === 'default') {
                         e.preventDefault();
                       }
                     }}
                   >
                     {t('downloadTemplate')}
                   </a>
                 </p>
               </div>
             </div>
          </section>

        </div>

        {/* RIGHT: STICKY SUMMARY PANEL */}
        <div className="w-full lg:w-[440px] lg:shrink-0 lg:sticky lg:top-32 self-start transition-all duration-500 ease-in-out z-10">
          <div className="p-6 bg-black text-white flex flex-col gap-6 shadow-2xl rounded-xl">
             
             <div className="flex flex-col gap-3">
                 <div className="flex items-end justify-between gap-4 w-full">
                    <div className="flex flex-col min-w-0 flex-1">
                      <h3 className="font-display text-base md:text-lg font-bold tracking-widest break-words md:break-normal md:whitespace-nowrap">
                        {t('step6')}
                      </h3>
                    </div>
                   {(size === '12' || size === '10' || size === '7') && (
                     <div className="font-display flex flex-col items-end gap-0.5 shrink-0 whitespace-nowrap">
                       {vinylPricing.current < vinylPricing.base && (
                         <>
                           <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded-md mb-0.5">
                             -{Math.round(((vinylPricing.base - vinylPricing.current) / vinylPricing.base) * 100)}%
                           </span>
                           <span className="text-gray-500 line-through text-xs">{vinylPricing.base} GEL</span>
                         </>
                       )}
                       <span className={`text-xl font-bold ${vinylPricing.current < vinylPricing.base ? 'text-green-500' : 'text-white'}`}>{vinylPricing.current} GEL</span>
                     </div>
                   )}
                 </div>
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
                    onBlur={() => {
                      if (quantity === '') {
                        setQuantity(1);
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

             {parsedOsQty > 0 && (
               <div className="flex items-start justify-between mt-4 gap-4 w-full">
                 <div className="flex flex-col min-w-0 flex-1 gap-1">
                   <span className="font-display font-bold text-white text-base md:text-lg break-words leading-tight">
                     {t('outerSleeveOption')}
                   </span>
                   <span className="font-display text-gray-400 text-sm">
                     {sleevePricing.current} GEL &times; {parsedOsQty.toLocaleString('en-US').replace(/,/g, ' ')}
                   </span>
                 </div>
                 <div className="flex flex-col items-end shrink-0 pl-2">
                   {sleevePricing.current < sleevePricing.base && (
                     <span className="text-gray-500 line-through text-xs font-display mb-0.5">
                       {(sleevePricing.base * parsedOsQty).toLocaleString('en-US').replace(/,/g, ' ')} GEL
                     </span>
                   )}
                   <span className={`font-display text-lg font-bold ${sleevePricing.current < sleevePricing.base ? 'text-green-500' : 'text-white'}`}>
                     {(sleevePricing.current * parsedOsQty).toLocaleString('en-US').replace(/,/g, ' ')} GEL
                   </span>
                 </div>
               </div>
             )}

             {stickerType === 'custom' && (
               <div className="flex items-start justify-between mt-4 gap-4 w-full">
                 <div className="flex flex-col min-w-0 flex-1 gap-1">
                   <span className="font-display font-bold text-white text-base md:text-lg break-words leading-tight">
                     {t('customSticker')}
                   </span>
                   <span className="font-display text-gray-400 text-sm">
                     8 GEL &times; {parsedQty.toLocaleString('en-US').replace(/,/g, ' ')}
                   </span>
                 </div>
                 <div className="flex flex-col items-end shrink-0 pl-2">
                   <span className="font-display text-lg font-bold text-white">
                     + {(8 * parsedQty).toLocaleString('en-US').replace(/,/g, ' ')} GEL
                   </span>
                 </div>
               </div>
             )}

             <hr className="border-white/20" />

             <div className="flex items-end justify-between mt-2">
                <span className="font-display tracking-widest text-gray-400 mb-1.5">{t('summaryTitle')}</span>
                <span className="font-display text-4xl font-bold">{calculateTotal().toLocaleString('en-US').replace(/,/g, ' ')} GEL</span>
             </div>

             <button 
               onClick={handleSubmit}
               disabled={!size || !color || !info.name || !info.phone || !info.email.includes('@') || isSubmitting}
               className="w-full py-6 mt-4 bg-white text-black font-display font-bold tracking-widest text-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-red hover:text-white transition-all transform hover:scale-[1.02] active:scale-95"
             >
                {isSubmitting ? 'SUBMITTING...' : t('submit')}
             </button>
             {submitResult && (
               <div className={`mt-4 text-center p-3 font-bold text-sm rounded ${submitResult.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                 {submitResult.message}
               </div>
             )}
          </div>
        </div>

      </main>
    </div>
  );
}
