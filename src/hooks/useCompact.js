import { useLayoutEffect, useState } from 'react';

/**
 * True when the map's own container is narrower than `maxWidth`.
 * Measures the container, not the window, so it also works when the map is
 * embedded in a narrow column of a WordPress page on a wide desktop screen.
 */
export function useCompact(ref, maxWidth = 820) {
  const [compact, setCompact] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= maxWidth
  );

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const update = () => setCompact(node.getBoundingClientRect().width <= maxWidth);
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, [ref, maxWidth]);

  return compact;
}
