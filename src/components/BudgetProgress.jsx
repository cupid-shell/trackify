import { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { AlertTriangle, GripVertical, Pin, Eye, EyeOff } from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import { applyOrder, splitPinned, togglePinned, moveInList, dropInsertIndex } from '../utils/budgetOrder';

const BudgetProgress = () => {
  const { userSettings, currentMonthTransactions, getCategoryStyle, formatCurrency, rolloverData, updateSettings } = useAppContext();
  const budgets = userSettings.category_budgets || {};
  const expenseCategories = userSettings.expense_categories || [];
  const metadata = userSettings.category_metadata || {};
  const savedOrder = metadata._budget_order || [];
  const pinnedList = metadata._budget_pinned || [];
  const hiddenList = metadata._budget_hidden || [];

  // Drag state (null when idle). We do NOT reshuffle the list mid-drag — the
  // dragged row just follows the finger via translateY and a drop line shows
  // where it will land, so it stays smooth. The reorder commits on release.
  const [drag, setDrag] = useState(null);
  const [showHidden, setShowHidden] = useState(false);
  const listRef = useRef(null);

  // Only categories that have a budget set and still exist as expense categories.
  const budgetedCategories = Object.keys(budgets).filter(cat => budgets[cat] > 0 && expenseCategories.includes(cat));

  if (budgetedCategories.length === 0) return null;

  const hiddenSet = new Set(hiddenList.filter(c => budgetedCategories.includes(c)));
  const visibleCategories = budgetedCategories.filter(c => !hiddenSet.has(c));
  const hiddenCategories = applyOrder(budgetedCategories.filter(c => hiddenSet.has(c)), savedOrder);

  // Calculate spent per category
  const spentByCategory = {};
  currentMonthTransactions
    .filter(tx => tx.type === 'expense')
    .forEach(tx => {
      spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + Number(tx.amount);
    });

  // Apply the saved manual order, then split into pinned (top) and unpinned groups.
  const sorted = applyOrder(visibleCategories, savedOrder);
  const { pinned, unpinned } = splitPinned(sorted, pinnedList);
  const canReorder = unpinned.length > 1;

  // One writer for all three prefs; hidden categories keep their order at the tail
  // so un-hiding restores their spot.
  const commit = (patch) => {
    updateSettings({
      category_metadata: {
        ...metadata,
        _budget_order: savedOrder,
        _budget_pinned: pinnedList,
        _budget_hidden: hiddenList,
        ...patch,
      },
    });
  };

  const togglePin = (cat) => {
    const { order, pinned: newPinned } = togglePinned(cat, sorted, pinnedList);
    commit({ _budget_order: [...order, ...hiddenCategories], _budget_pinned: newPinned });
  };

  const hideCat = (cat) => commit({ _budget_hidden: [...hiddenList.filter(c => c !== cat), cat] });
  const showCat = (cat) => commit({ _budget_hidden: hiddenList.filter(c => c !== cat) });

  const startDrag = (e, cat) => {
    if (!canReorder) return;
    e.preventDefault();
    try { e.target.setPointerCapture(e.pointerId); } catch { /* setPointerCapture may be unsupported */ }
    const fromIndex = unpinned.indexOf(cat);
    setDrag({ cat, fromIndex, startY: e.clientY, curY: e.clientY, targetIndex: fromIndex, indicatorY: 0 });
  };

  const moveDrag = (e) => {
    if (!drag || !listRef.current) return;
    const curY = e.clientY;
    const cRect = listRef.current.getBoundingClientRect();
    const rows = Array.from(listRef.current.querySelectorAll('[data-drag-row]'));
    // Use offsetTop/offsetHeight (layout position, unaffected by the drag
    // transform) so the row being dragged doesn't corrupt the hit-testing.
    let target = rows.length;
    for (let i = 0; i < rows.length; i++) {
      const mid = cRect.top + rows[i].offsetTop + rows[i].offsetHeight / 2;
      if (curY < mid) { target = i; break; }
    }
    const indicatorY = target >= rows.length
      ? rows[rows.length - 1].offsetTop + rows[rows.length - 1].offsetHeight
      : rows[target].offsetTop;
    setDrag(d => (d ? { ...d, curY, targetIndex: target, indicatorY } : d));
  };

  const endDrag = () => {
    if (!drag) return;
    const { cat, fromIndex, targetIndex } = drag;
    const newUnpinned = moveInList(unpinned, cat, dropInsertIndex(fromIndex, targetIndex));
    if (newUnpinned !== unpinned) {
      commit({ _budget_order: [...pinned, ...newUnpinned, ...hiddenCategories] });
    }
    setDrag(null);
  };

  const iconBtn = {
    background: 'none',
    border: 'none',
    padding: '0.15rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  };

  const renderRow = (cat, isPinnedRow) => {
    const baseLimit = budgets[cat];
    const rollover = rolloverData?.[cat] || 0;
    const limit = baseLimit + rollover;

    const spent = spentByCategory[cat] || 0;
    const percentage = Math.min((spent / limit) * 100, 100);
    const isOver = spent >= limit;
    const isWarning = percentage >= 80 && !isOver;

    const diff = limit - spent;
    const diffAbs = Math.abs(diff);
    const diffText = isOver ? `${formatCurrency(diffAbs)} over` : `${formatCurrency(diffAbs)} left`;
    const diffColor = isOver ? 'var(--danger)' : 'var(--success)';
    const isDragging = drag?.cat === cat;
    const dragStyle = isDragging
      ? {
          transform: `translateY(${drag.curY - drag.startY}px)`,
          position: 'relative',
          zIndex: 20,
          boxShadow: 'var(--shadow-lg)',
          transition: 'none',
          opacity: 0.97,
        }
      : {};

    return (
      <div key={cat} data-drag-row style={{
        padding: '0.75rem',
        backgroundColor: 'var(--bg-input)',
        borderRadius: 'var(--radius-md)',
        ...dragStyle,
      }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            {!isPinnedRow && canReorder && (
              <span
                onPointerDown={(e) => startDrag(e, cat)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                role="button"
                aria-label={`Drag to reorder ${cat}`}
                title="Drag to reorder"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  color: 'var(--text-muted)',
                  touchAction: 'none',
                  marginLeft: '-0.15rem',
                }}
              >
                <GripVertical size={15} />
              </span>
            )}
            <CategoryIcon category={cat} size={16} />
            <span style={{ fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat}</span>
          </div>
          <div className="flex items-center gap-2">
            {(isOver || isWarning) && <AlertTriangle size={14} color={isOver ? 'var(--danger)' : 'var(--warning)'} />}
            <div className="flex-col" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: isOver ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--text-main)',
                display: 'block'
              }}>
                {formatCurrency(spent)} / {formatCurrency(limit)}
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 500,
                color: diffColor,
                display: 'block',
                marginTop: '2px'
              }}>
                {diffText}
              </span>
            </div>
            <button
              type="button"
              onClick={() => togglePin(cat)}
              aria-label={isPinnedRow ? `Unpin ${cat}` : `Pin ${cat} to top`}
              aria-pressed={isPinnedRow}
              title={isPinnedRow ? 'Unpin' : 'Pin to top'}
              style={{ ...iconBtn, color: isPinnedRow ? 'var(--primary)' : 'var(--text-muted)' }}
            >
              <Pin size={15} fill={isPinnedRow ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              onClick={() => hideCat(cat)}
              aria-label={`Hide ${cat} from the budget tracker`}
              title="Hide from board"
              style={{ ...iconBtn, color: 'var(--text-muted)' }}
            >
              <EyeOff size={15} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            borderRadius: '4px',
            background: isOver
              ? 'var(--danger)'
              : isWarning
                ? 'linear-gradient(90deg, var(--warning), var(--danger))'
                : `linear-gradient(90deg, ${getCategoryStyle(cat).color}, ${getCategoryStyle(cat).color}dd)`,
            transition: 'width 0.5s ease'
          }} />
          {rollover > 0 && spent < limit && (
            <div style={{
              position: 'absolute',
              left: `${(baseLimit / limit) * 100}%`,
              top: 0,
              width: '1.5px',
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.45)',
              zIndex: 1
            }} title="Base budget limit boundary" />
          )}
        </div>

        {rollover > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.4rem',
            fontSize: '0.7rem',
            color: 'var(--text-muted)'
          }}>
            <span>Base: {formatCurrency(baseLimit)}</span>
            <span style={{ color: 'var(--success)', fontWeight: 500 }}>Rollover: +{formatCurrency(rollover)}</span>
          </div>
        )}
      </div>
    );
  };

  // Drop line only when the target slot is an actual move (not the item's own spot).
  const showDropLine = drag && drag.targetIndex !== drag.fromIndex && drag.targetIndex !== drag.fromIndex + 1;
  const hasControlsHint = visibleCategories.length > 0;

  return (
    <div className="glass-card flex-col gap-4">
      <div className="flex items-center justify-between" style={{ gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem' }}>Budget Tracker</h2>
        {hasControlsHint && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Pin · drag · hide</span>
        )}
      </div>

      <div className="flex-col gap-3">
        {pinned.map(cat => renderRow(cat, true))}
        {pinned.length > 0 && unpinned.length > 0 && (
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.1rem 0' }} />
        )}
        <div ref={listRef} className="flex-col gap-3" style={{ position: 'relative' }}>
          {showDropLine && (
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${drag.indicatorY}px`,
              height: '2px',
              background: 'var(--primary)',
              borderRadius: '2px',
              zIndex: 10,
              pointerEvents: 'none',
            }} />
          )}
          {unpinned.map(cat => renderRow(cat, false))}
        </div>
      </div>

      {visibleCategories.length === 0 && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
          All categories are hidden. Use “Show hidden” below to bring them back.
        </p>
      )}

      {hiddenCategories.length > 0 && (
        <div className="flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowHidden(s => !s)}
            aria-expanded={showHidden}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              alignSelf: 'flex-start',
            }}
          >
            <EyeOff size={13} />
            {showHidden ? 'Hide' : 'Show'} hidden ({hiddenCategories.length})
          </button>
          {showHidden && hiddenCategories.map(cat => (
            <div key={cat} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.4rem 0.6rem',
              backgroundColor: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              opacity: 0.8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <CategoryIcon category={cat} size={14} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat}</span>
              </div>
              <button
                type="button"
                onClick={() => showCat(cat)}
                aria-label={`Show ${cat} on the budget tracker`}
                title="Show on board"
                style={{ ...iconBtn, color: 'var(--text-muted)' }}
              >
                <Eye size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BudgetProgress;
