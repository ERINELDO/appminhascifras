
import React, { useEffect, useRef } from 'react';

export const MarketTicker: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        "symbols": [
          { "proName": "BMFBOVESPA:IBOV", "title": "IBOVESPA" },
          { "proName": "FOREXCOM:SPX3500", "title": "S&P 500" },
          { "proName": "FOREXCOM:NSXUSD", "title": "Nasdaq 100" },
          { "proName": "FX_IDC:USDBRL", "title": "Dólar/BRL" },
          { "proName": "FX_IDC:EURBRL", "title": "Euro/BRL" },
          { "proName": "FX_IDC:GBPBRL", "title": "Libra/BRL" },
          { "proName": "BITSTAMP:BTCUSD", "title": "Bitcoin" },
          { "proName": "BITSTAMP:ETHUSD", "title": "Ethereum" },
          { "proName": "BINANCE:SOLUSD", "title": "Solana" },
          { "proName": "TVC:GOLD", "title": "Ouro" },
          { "proName": "TVC:USOIL", "title": "Petróleo WTI" },
          { "proName": "BMFBOVESPA:PETR4", "title": "PETR4" },
          { "proName": "BMFBOVESPA:VALE3", "title": "VALE3" },
          { "proName": "BMFBOVESPA:ITUB4", "title": "ITUB4" },
          { "proName": "BMFBOVESPA:BBAS3", "title": "BBAS3" },
          { "proName": "BMFBOVESPA:B3SA3", "title": "B3" }
        ],
        "showSymbolLogo": true,
        "colorTheme": "light",
        "isTransparent": true,
        "displayMode": "adaptive",
        "locale": "br",
        "largeChartUrl": ""
      });
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full overflow-hidden bg-white/50 backdrop-blur-sm rounded-xl border border-slate-100 shadow-inner group">
      <div ref={containerRef} className="tradingview-widget-container translate-y-[-1px]">
        {/* TradingView injects content here. The negative margin helps hide the small bottom attribution line if possible */}
      </div>
      <style>{`
        /* Tentativa de suavizar a transição e esconder elementos desnecessários do widget externo */
        .tradingview-widget-copyright {
          display: none !important;
        }
      `}</style>
    </div>
  );
};