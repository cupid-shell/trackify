// Pure ordering logic for the Budget Tracker's pin-to-top + drag reordering.
// Kept out of the component (which is all JSX) so it runs under the plugin-free
// vitest config and can be unit-tested. The Budget Tracker persists two arrays
// in category_metadata: `_budget_order` (canonical [pinned…, unpinned…] order)
// and `_budget_pinned` (which categories are pinned to the top).

// Sort categories by their position in the saved order. Categories not present
// in savedOrder (e.g. a newly budgeted one) keep their incoming order at the end.
export const applyOrder = (categories, savedOrder = []) => {
  const index = (c) => {
    const i = savedOrder.indexOf(c);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...categories].sort((a, b) => index(a) - index(b));
};

// Split an already-sorted list into pinned (top) and unpinned groups,
// preserving the sorted sequence within each group.
export const splitPinned = (sorted, pinnedList = []) => {
  const set = new Set(pinnedList);
  return {
    pinned: sorted.filter((c) => set.has(c)),
    unpinned: sorted.filter((c) => !set.has(c)),
  };
};

// Toggle a category's pinned state. Returns the new canonical order
// ([pinned…, unpinned…]) and the new pinned list. Pinning appends to the bottom
// of the pinned group; unpinning drops it to the top of the unpinned group.
export const togglePinned = (cat, sorted, pinnedList = []) => {
  const pinned = pinnedList.includes(cat)
    ? pinnedList.filter((c) => c !== cat)
    : [...pinnedList.filter((c) => c !== cat), cat];
  const set = new Set(pinned);
  const order = [
    ...sorted.filter((c) => set.has(c)),
    ...sorted.filter((c) => !set.has(c)),
  ];
  return { order, pinned };
};

// Move `cat` to `targetIndex` within a list (used during a drag). Returns the
// same reference unchanged when there is nothing to move.
export const moveInList = (list, cat, targetIndex) => {
  const cur = list.indexOf(cat);
  if (cur === -1 || cur === targetIndex) return list;
  const next = list.slice();
  next.splice(cur, 1);
  next.splice(targetIndex, 0, cat);
  return next;
};
