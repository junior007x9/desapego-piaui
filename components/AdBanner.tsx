"use client";

import { useEffect, useRef } from "react";

type AdBannerProps = {
  dataAdSlot: string;
  dataAdFormat?: string;
  dataFullWidthResponsive?: boolean;
};

export default function AdBanner({ 
  dataAdSlot, 
  dataAdFormat = "auto", 
  dataFullWidthResponsive = true 
}: AdBannerProps) {
  // O useRef garante que o script do AdSense seja chamado apenas UMA VEZ
  // Isso resolve o problema de anúncios em branco no Next.js (React Strict Mode)
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
    // Adicionado min-h-[90px] e fundo sutil para evitar o "vão" na tela inicial
    <div className="flex justify-center w-full overflow-hidden bg-gray-50/50 min-h-[90px] rounded-lg">
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client="ca-pub-5151678673256465"
        data-ad-slot={dataAdSlot}
        data-ad-format={dataAdFormat}
        data-full-width-responsive={dataFullWidthResponsive.toString()}
      ></ins>
    </div>
  );
}