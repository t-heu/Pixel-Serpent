"use client";

import React, { useEffect, useState } from "react";

type AdBannerTypes = {
  dataAdSlot: string;
  dataAdFormat: string;
  dataFullWidthResponsive: boolean;
};

const AdBanner = ({
  dataAdSlot,
  dataAdFormat,
  dataFullWidthResponsive,
}: AdBannerTypes) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoaded(false); // se ainda não tiver carregado, mostra fallback
    }, 3000); // tempo limite (ex: 3s)

    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      setLoaded(true); // tentativa de carregar
    } catch (error: any) {
      console.log(error.message);
      setLoaded(false);
    }

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="relative min-h-[100px] border-t-2 border-[#1e293b] mt-1">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-7158647172444246"
        data-ad-slot={dataAdSlot}
        data-ad-format={dataAdFormat}
        data-full-width-responsive={dataFullWidthResponsive.toString()}
      ></ins>
      {!loaded && (
        <div
          style={{
            content: '"advertisement"',
            color: "#bbb",
            fontSize: "12px",
            border: "1px solid #ccc",
            padding: "7px 12px",
            display: "block",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: -1,
            fontFamily: "monospace"
          }}
        >
          advertisement
        </div>
      )}
    </div>
  );
};

export default AdBanner;
