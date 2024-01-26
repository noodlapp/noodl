import { useMemo } from 'react';

export default function useParsedHref(href?: string) {
  if (!href) return null;

  const parsedHref = useMemo(() => {
    let newHref = href.trim().replace(/\s/g, '');

    if (/^(:\/\/)/.test(newHref)) {
      return `http${newHref}`;
    }
    if (!/^(f|ht)tps?:\/\//i.test(newHref)) {
      return `http://${newHref}`;
    }

    return newHref;
  }, [href]);

  return parsedHref;
}
