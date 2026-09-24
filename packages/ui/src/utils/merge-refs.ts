import type { Ref } from "react";

/**
 * Combines several refs (callback or object) into a single callback ref that
 * forwards the node to all of them. First shared internal util extracted from
 * the local copy originally authored in Dialog (RRU-053) once a second
 * consumer appeared (Popover, RRU-054) — the RRU-053 note promised exactly
 * this extraction trigger. Internal module: not exported from the package
 * root (docs/typescript.md §4, frontera §24).
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null): void => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") {
        ref(node);
      } else {
        ref.current = node;
      }
    }
  };
}
