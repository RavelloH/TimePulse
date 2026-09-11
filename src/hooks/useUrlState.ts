import { useEffect, useState } from 'react';

export function useUrlSearchParam(name: string): string | null {
  const [value, setValue] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get(name);
  });

  useEffect(() => {
    const update = () => setValue(new URLSearchParams(window.location.search).get(name));
    window.addEventListener('popstate', update);
    window.addEventListener('hashchange', update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('hashchange', update);
    };
  }, [name]);

  return value;
}

export function useLocationHash(): string {
  const [hash, setHash] = useState(() => (typeof window === 'undefined' ? '' : window.location.hash));

  useEffect(() => {
    const update = () => setHash(window.location.hash);
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);

  return hash;
}
