import { describe, it, expect } from 'vitest';
import { applyOrder, splitPinned, togglePinned, moveInList } from './budgetOrder';

const CATS = ['Rent', 'Transport', 'Daily Living', 'Food & Dining', 'Utilities'];

describe('applyOrder', () => {
  it('orders by the saved sequence', () => {
    const saved = ['Food & Dining', 'Transport', 'Rent'];
    expect(applyOrder(['Rent', 'Transport', 'Food & Dining'], saved))
      .toEqual(['Food & Dining', 'Transport', 'Rent']);
  });

  it('keeps categories missing from savedOrder at the end, in input order', () => {
    const saved = ['Transport'];
    expect(applyOrder(['Rent', 'Transport', 'Utilities'], saved))
      .toEqual(['Transport', 'Rent', 'Utilities']);
  });

  it('is a no-op ordering when savedOrder is empty', () => {
    expect(applyOrder(CATS, [])).toEqual(CATS);
  });
});

describe('splitPinned', () => {
  it('separates pinned (top) from unpinned, preserving order within each group', () => {
    const { pinned, unpinned } = splitPinned(CATS, ['Food & Dining', 'Rent']);
    expect(pinned).toEqual(['Rent', 'Food & Dining']); // in sorted order, not pinned-list order
    expect(unpinned).toEqual(['Transport', 'Daily Living', 'Utilities']);
  });

  it('handles no pins', () => {
    expect(splitPinned(CATS, [])).toEqual({ pinned: [], unpinned: CATS });
  });

  it('ignores pinned entries that are not in the list', () => {
    const { pinned, unpinned } = splitPinned(['Rent', 'Transport'], ['Groceries', 'Rent']);
    expect(pinned).toEqual(['Rent']);
    expect(unpinned).toEqual(['Transport']);
  });
});

describe('togglePinned', () => {
  it('pins an unpinned category to the bottom of the pinned group', () => {
    // Rent is unpinned; pinning it should move it above the other unpinned ones.
    const { order, pinned } = togglePinned('Rent', CATS, []);
    expect(pinned).toEqual(['Rent']);
    expect(order[0]).toBe('Rent');
    expect(order).toEqual(['Rent', 'Transport', 'Daily Living', 'Food & Dining', 'Utilities']);
  });

  it('appends a newly pinned category after already-pinned ones', () => {
    const sorted = ['Food & Dining', 'Rent', 'Transport', 'Utilities'];
    const { order, pinned } = togglePinned('Transport', sorted, ['Food & Dining']);
    expect(pinned).toEqual(['Food & Dining', 'Transport']);
    // pinned group [Food & Dining, Transport] then unpinned [Rent, Utilities]
    expect(order).toEqual(['Food & Dining', 'Transport', 'Rent', 'Utilities']);
  });

  it('unpinning drops a category to the top of the unpinned group', () => {
    const sorted = ['Food & Dining', 'Rent', 'Transport', 'Utilities'];
    const { order, pinned } = togglePinned('Food & Dining', sorted, ['Food & Dining', 'Rent']);
    expect(pinned).toEqual(['Rent']);
    // pinned [Rent], then unpinned starting with the just-unpinned Food & Dining
    expect(order).toEqual(['Rent', 'Food & Dining', 'Transport', 'Utilities']);
  });
});

describe('moveInList', () => {
  it('moves an item down to a target index', () => {
    expect(moveInList(['a', 'b', 'c', 'd'], 'a', 2)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves an item up to a target index', () => {
    expect(moveInList(['a', 'b', 'c', 'd'], 'd', 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('returns the same reference when nothing changes', () => {
    const list = ['a', 'b', 'c'];
    expect(moveInList(list, 'b', 1)).toBe(list);
    expect(moveInList(list, 'missing', 0)).toBe(list);
  });
});
