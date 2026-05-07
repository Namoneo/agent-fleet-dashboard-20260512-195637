'use client';

import { useEffect, useState } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { MobileLayout } from '@/components/MobileLayout';
import { useMobileDetect } from '@/hooks/useMobileDetect';

export default function Home() {
  const { isMobile } = useMobileDetect();
  const [data, setData] = useState<any>(null);

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }, []);

  // Fetch data
  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-zinc-400">Loading Fleet...</p>
        </div>
      </div>
    );
  }

  return (
    <main>
      {isMobile ? (
        <MobileLayout data={data} />
      ) : (
        <Dashboard />
      )}
    </main>
  );
}
