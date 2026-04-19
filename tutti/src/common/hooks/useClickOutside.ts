"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * `enabled`일 때 document에서 mousedown/touchstart가 ref 바깥이면 `onClose` 호출.
 * 키보드 포커스 이동만으로는 닫히지 않아 Tab 탐색 시 onMouseLeave보다 안정적입니다.
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  enabled: boolean,
  onClose: () => void,
): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!enabled) return;

    const handle = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el) return;
      const t = event.target;
      if (t instanceof Node && !el.contains(t)) {
        onCloseRef.current();
      }
    };

    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [enabled, ref]);
}
