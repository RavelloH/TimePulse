/// <reference types="vite/client" />

interface Window {
  insightflare?: {
    track?: (name: string, data?: Record<string, unknown>) => void;
    trackOnce?: (name: string, data?: Record<string, unknown>) => void;
  };
}
