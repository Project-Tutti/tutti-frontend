"use client";

import { useEffect } from "react";

let lockCount = 0;

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    lockCount++;
    document.body.style.overflow = "hidden";

    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.style.overflow = "";
      }
    };
  }, [isLocked]);
}
