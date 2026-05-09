"use client";

import { useEffect, useRef } from "react";

type AdBannerProps = {
  dataAdSlot: string;
  dataAdFormat?: string;
  dataFullWidthResponsive?: boolean;
};

export default function AdBanner({ 
  dataAdSlot, 
  dataAdFormat = "horizontal", // 🚀 MUDANÇA 1: Força o formato fino (horizontal) em vez de quadrado automático
  dataFullWidthResponsive = false // 🚀 MUDANÇA 2: Impede o Google de alargar a altura livremente
}: AdBannerProps) {
  const isLoaded = useRef(false);

  useEffect(() => {
    if (!isLoaded.current) {
      try {
        // @ts-expect-error
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isLoaded.current = true;
      } catch (err) {
        console.error("Erro ao carregar o anúncio do AdSense:", err);
      }
    }
  }, []);

  return (
    // 🚀 MUDANÇA 3: max-h-[100px] é a trava de segurança. O buraco nunca vai passar de 100 pixels!
    <div className="flex justify-center w-full overflow-hidden bg-transparent min-h-[90px] max-h-[100px]">
      <ins
        className="adsbygoogle"
        style={{ display: "inline-block", width: "100%", height: "90px" }} // Força a altura padrão de banner
        data-ad-client="ca-pub-5151678673256465"
        data-ad-slot={dataAdSlot}
        data-ad-format={dataAdFormat}
        data-full-width-responsive={dataFullWidthResponsive.toString()}
      ></ins>
    </div>
  );
}