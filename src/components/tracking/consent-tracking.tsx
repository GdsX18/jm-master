'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

export interface TrackingSettings {
  gtmId: string;
  gaId: string;
  metaPixelId: string;
  tiktokPixelId: string;
  customHeaderScript: string;
  customBodyScript: string;
}

type Consent = 'granted' | 'denied' | null;

const CONSENT_KEY = 'jm_cookie_consent';
export const OPEN_COOKIE_SETTINGS_EVENT = 'jm:open-cookie-settings';

function readConsent(): Consent {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

// Insere HTML arbitrário (configurado no painel) executando os <script> contidos
function injectHtml(html: string, target: HTMLElement, marker: string) {
  if (!html || document.querySelector(`[data-jm-custom="${marker}"]`)) return;
  const fragment = document.createRange().createContextualFragment(html);
  const wrapper = document.createElement('div');
  wrapper.dataset.jmCustom = marker;
  wrapper.style.display = 'none';
  wrapper.appendChild(fragment);
  target.appendChild(wrapper);
}

export function ConsentTracking({ settings }: { settings: TrackingSettings | null }) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent>(null);
  const [mounted, setMounted] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);

  useEffect(() => {
    const stored = readConsent();
    setConsent(stored);
    setBannerOpen(stored === null);
    setMounted(true);

    const open = () => setBannerOpen(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, []);

  useEffect(() => {
    if (consent !== 'granted' || !settings) return;
    injectHtml(settings.customHeaderScript, document.head, 'header');
    injectHtml(settings.customBodyScript, document.body, 'body');
  }, [consent, settings]);

  const decide = (value: 'granted' | 'denied') => {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {}
    const changedToDenied = consent === 'granted' && value === 'denied';
    setConsent(value);
    setBannerOpen(false);
    // Scripts já carregados não podem ser descarregados; recarrega para removê-los
    if (changedToDenied) window.location.reload();
  };

  // O painel administrativo não exibe banner nem carrega pixels
  if (!mounted || pathname?.startsWith('/painel')) return null;

  const allowed = consent === 'granted' && settings;

  return (
    <>
      {allowed && settings.gtmId && (
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',${JSON.stringify(settings.gtmId)});`}
        </Script>
      )}

      {allowed && settings.gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(settings.gaId)}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(settings.gaId)});`}
          </Script>
        </>
      )}

      {allowed && settings.metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', ${JSON.stringify(settings.metaPixelId)});
fbq('track', 'PageView');`}
        </Script>
      )}

      {allowed && settings.tiktokPixelId && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function (w, d, t) {
w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=r+"?sdkid="+e+"&lib="+t;var c=document.getElementsByTagName("script")[0];c.parentNode.insertBefore(a,c)};
ttq.load(${JSON.stringify(settings.tiktokPixelId)});
ttq.page();
}(window, document, 'ttq');`}
        </Script>
      )}

      {bannerOpen && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Preferências de cookies"
          className="fixed bottom-4 inset-x-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-[10000] p-5 rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/20 text-slate-700"
        >
          <p className="text-sm leading-relaxed">
            Usamos cookies para medir o desempenho do site e personalizar anúncios. Você pode aceitar ou recusar
            os cookies não essenciais. Saiba mais na nossa{' '}
            <Link href="/politica-de-privacidade" className="underline font-semibold text-[#082B61]">
              Política de Privacidade
            </Link>
            .
          </p>
          <div className="mt-4 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => decide('denied')}
              className="px-4 py-2 rounded-full border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Recusar
            </button>
            <button
              type="button"
              onClick={() => decide('granted')}
              className="px-4 py-2 rounded-full bg-[#E64F14] text-xs font-bold text-white hover:bg-[#cf4510] transition-colors"
            >
              Aceitar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
