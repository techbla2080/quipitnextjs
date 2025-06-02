// lib/gtag.ts
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Track page views
export const pageview = (url: string): void => {
  if (
    typeof window !== 'undefined' &&
    typeof window.gtag === 'function' &&
    GA_MEASUREMENT_ID
  ) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Track custom events
interface GtagEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export const event = ({ action, category, label, value }: GtagEvent): void => {
  if (
    typeof window !== 'undefined' &&
    typeof window.gtag === 'function' &&
    GA_MEASUREMENT_ID
  ) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// types/gtag.d.ts - Add this file for global gtag types
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: {
        page_path?: string;
        event_category?: string;
        event_label?: string;
        value?: number;
      }
    ) => void;
    dataLayer: any[];
  }
}

export {};