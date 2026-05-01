"use client";

import { useEffect } from "react";

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
  
  useEffect(() => {
    try {
      // @ts-expect-error
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("Erro ao carregar o anúncio do AdSense:", err);
    }
  }, []);

  return (
    <div className="my-4 flex justify-center w-full overflow-hidden">
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