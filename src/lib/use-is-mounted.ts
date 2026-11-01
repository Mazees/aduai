"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Hydration-safe mount hook using React's official useSyncExternalStore.
 * Returns `false` on the server and during initial client hydration,
 * and `true` immediately after hydration is complete.
 * Prevents hydration mismatch errors when reading from localStorage or client-only APIs.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

