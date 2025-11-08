import { useEffect } from "react";

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const target = document.documentElement;
    const previousOverflow = target.style.overflow;

    if (active) {
      target.style.overflow = "hidden";
      return () => {
        target.style.overflow = previousOverflow;
      };
    }

    return undefined;
  }, [active]);
}
