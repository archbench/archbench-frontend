import { useEffect } from "react";

export interface HotkeyBinding {
  key: string;
  handler: (event: KeyboardEvent) => void;
  enabled?: boolean;
}

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  const tagName = target.tagName;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
    return true;
  }
  return false;
};

export function useHotkeys(bindings: HotkeyBinding[]) {
  useEffect(() => {
    const activeBindings = bindings.filter((binding) => binding.enabled !== false);
    if (!activeBindings.length) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      if (isEditableTarget(event.target)) {
        return;
      }
      const key = event.key.toLowerCase();
      const match = activeBindings.find((binding) => binding.key.toLowerCase() === key);
      if (!match) {
        return;
      }
      event.preventDefault();
      match.handler(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [bindings]);
}

