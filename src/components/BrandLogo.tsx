import React, { useState } from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'compact';
  className?: string;
  onClick?: () => void;
}

export default function BrandLogo({
  variant = 'full',
  className = '',
  onClick
}: BrandLogoProps) {
  const [imgError, setImgError] = useState(false);

  // If there's no image error, attempt to render the actual logo image file
  if (!imgError) {
    if (variant === 'compact') {
      return (
        <div 
          onClick={onClick}
          className={`flex items-center space-x-2 select-none ${onClick ? 'cursor-pointer hover:opacity-90' : ''} ${className}`}
        >
          <img 
            src="/logo.png" 
            alt="Salgadaria Glaubia" 
            className="h-10 w-auto object-contain rounded"
            onError={() => setImgError(true)}
          />
          <div className="hidden sm:flex flex-col text-left leading-none">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Aberto</span>
            <span className="text-[11px] text-stone-400">Pedir Agora</span>
          </div>
        </div>
      );
    }

    return (
      <div 
        onClick={onClick}
        className={`flex justify-center items-center overflow-hidden rounded-2xl bg-[#f86b06] p-3 shadow-xl shadow-orange-950/20 border border-orange-400/20 ${onClick ? 'cursor-pointer hover:scale-[1.01] transition duration-200' : ''} ${className}`}
      >
        <img 
          src="/logo.png" 
          alt="Salgadaria Glaubia Logo" 
          className="max-h-36 md:max-h-48 w-auto object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback: Elegant text-based brand when there is no logo image file uploaded yet
  if (variant === 'compact') {
    return (
      <div 
        onClick={onClick}
        className={`flex items-center space-x-2 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f86b06] font-display text-base font-black text-black shadow-md shadow-orange-950/30">
          G
        </div>
        <div className="flex flex-col">
          <span className="font-display text-sm font-bold tracking-tight text-white sm:text-base leading-none">
            Salgadaria <span className="text-orange-500">Glaubia</span>
          </span>
          <span className="flex items-center space-x-1 text-[9px] text-stone-400 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Aberto</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`text-center select-none py-4 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="inline-flex flex-col items-center">
        <span className="font-sans text-xs font-black uppercase tracking-[0.3em] text-[#f86b06]">
          Salgadaria
        </span>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl -mt-1">
          Glaubia
        </h1>
        <p className="mt-2 text-stone-400 italic text-sm">
          Uma delícia de sabor
        </p>
      </div>
    </div>
  );
}
