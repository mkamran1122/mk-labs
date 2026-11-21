import { useState, useEffect, useCallback } from 'react';

export interface RouteState {
  path: string;
  search: string;
  hash: string;
  params: Record<string, string>;
}

const ROUTER_CHANGE_EVENT = 'mk:router-change';

export function useRouter() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [search, setSearch] = useState<string>(() => window.location.search);
  const [hash, setHash] = useState<string>(() => window.location.hash);

  useEffect(() => {
    const syncRoute = () => {
      setCurrentPath(window.location.pathname || '/');
      setSearch(window.location.search);
      setHash(window.location.hash);
    };

    window.addEventListener('popstate', syncRoute);
    window.addEventListener(ROUTER_CHANGE_EVENT, syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener(ROUTER_CHANGE_EVENT, syncRoute);
    };
  }, []);

  const navigate = useCallback((url: string, replace = false) => {
    if (url.startsWith('#')) {
      const el = document.querySelector(url);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      window.history.pushState(null, '', url);
      window.dispatchEvent(new Event(ROUTER_CHANGE_EVENT));
      return;
    }

    if (replace) {
      window.history.replaceState(null, '', url);
    } else {
      window.history.pushState(null, '', url);
    }

    window.dispatchEvent(new Event(ROUTER_CHANGE_EVENT));

    if (!url.includes('#')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Parse path matching helper
  const matchPath = useCallback((pattern: string): Record<string, string> | null => {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = currentPath.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) return null;

    const params: Record<string, string> = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        const paramName = patternParts[i].slice(1);
        params[paramName] = decodeURIComponent(pathParts[i]);
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }, [currentPath]);

  return {
    path: currentPath,
    search,
    hash,
    navigate,
    matchPath,
  };
}
