import React from 'react';
import Script from 'next/script';
import prisma from '@/lib/prisma';

export async function TrackingScripts() {
  let settings = null;
  try {
    settings = await prisma.siteSetting.findUnique({
      where: { id: 'default' },
    });
  } catch (e) {
    // Silencioso caso ocorra durante build offline
  }

  if (!settings) return null;

  const { gtmId, gaId, metaPixelId, tiktokPixelId, customHeaderScript, customBodyScript } = settings;

  return (
    <>
      {/* 1. GOOGLE TAG MANAGER (GTM) */}
      {gtmId && gtmId.trim() && (
        <>
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId.trim()}');
            `}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId.trim()}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}

      {/* 2. GOOGLE ANALYTICS 4 (GA4) */}
      {gaId && gaId.trim() && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId.trim()}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId.trim()}');
            `}
          </Script>
        </>
      )}

      {/* 3. META / FACEBOOK PIXEL */}
      {metaPixelId && metaPixelId.trim() && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId.trim()}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${metaPixelId.trim()}&ev=PageView&noscript=1`}
              alt="Meta Pixel"
            />
          </noscript>
        </>
      )}

      {/* 4. TIKTOK PIXEL */}
      {tiktokPixelId && tiktokPixelId.trim() && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=r+"?sdkid="+e+"&lib="+t;var c=document.getElementsByTagName("script")[0];c.parentNode.insertBefore(a,c)};
              ttq.load('${tiktokPixelId.trim()}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}

      {/* 5. SCRIPTS CUSTOMIZADOS DE CABEÇALHO */}
      {customHeaderScript && customHeaderScript.trim() && (
        <div dangerouslySetInnerHTML={{ __html: customHeaderScript }} />
      )}

      {/* 6. SCRIPTS CUSTOMIZADOS DE CORPO */}
      {customBodyScript && customBodyScript.trim() && (
        <div dangerouslySetInnerHTML={{ __html: customBodyScript }} />
      )}
    </>
  );
}
