import React, { useEffect } from 'react'
import { initAnalytics } from '@pinjollist/next-with-analytics';
import { useRouter } from 'next/router';
import './_app.scss'

const options = {
  trackingCode: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_TRACKING_ID,
  respectDNT: true,
  anonymizeIp: true,
};

const analyticsInstance = initAnalytics(options);

export default function App({ Component, pageProps }: { Component: React.ComponentType, pageProps: any }) {
  const router = useRouter()
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      const { handleRouteChange } = analyticsInstance;
  
      // Enable tracking page views for route change
      router.events.on('routeChangeComplete', handleRouteChange);
  
       // Disable tracking page views for route change before unmount
      return () => router.events.off('routeChangeComplete', handleRouteChange);
    }
  }, [])
  useEffect(() => {
    document.querySelector('html')
      ?.classList.remove('noJs')
  }, [])
  
  return <Component {...pageProps} />
}
