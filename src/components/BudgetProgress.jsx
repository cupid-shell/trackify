import { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { AlertTriangle, GripVertical, Pin } from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import { applyOrder, splitPinned, togglePinned, moveInList } from '../utils/budgetOrder';

const BudgetProgress = () => {
  const { userSettings, currentMonthTransactions, getCategoryStyle, formatCurrency, rolloverData, updateSettings } = useAppContext();
  const budgets = userSettings.category_budgets || {};
  const expenseCategories = userSettings.expense_categories || [];
  const metadata = userSettings.category_metadata || {};
  const savedOrder = metadata._budget_order || [];
  const pinnedList = metadata._budget_pinned || [];

  // Live drag state (null when idle). `list` is the unpinned order being dragged
  // so the UI reorders smoothly before we persist on drop.
  const [drag, setDrag] = useState(null);
  const listRef = useRef(null);

  // Only show categories that have a budget set and exist in the current expense categories
  const budgetedCategories = Object.keys(budgets).filter(cat => budgets[cat] > 0 && expenseCategories.includes(cat));

  if (budgetedCategories.length === 0) return null;

  // Calculate spent per category
  const spentByCategory = {};
  currentMonthTransactions
    .filter(tx => tx.type === 'expense')
    .forEach(tx => {
      spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + Number(tx.amount);
    });

  // Apply the saved manual order, then split into pinned (top) and unpinned groups.
  const sorted = applyOrder(budgetedCategories, savedOrder);
  const { pinned, unpinned } = splitPinned(sorted, pinnedList);
  const unpinnedDisplay = drag ? drag.list : unpinned;
  const canReorder = unpinned.length > 1;

  const persist = (orderArr, pinnedArr) => {
    updateSettings({
      category_metadata: { ...metadata, _budget_order: orderArr, _budget_pinned: pinnedArr },
    });
  };

  const togglePin = (cat) => {
    const { order, pinned: newPinned } = togglePinned(cat, sorted, pinnedList);
    persist(order, newPinned);
  };

  const startDrag = (e, cat) => {
    if (!canReorder) return;
    e.preventDefault();
    try { e.target.setPointerCapture(e.pointerId); } catch { /* setPointerCapture may be unsupported */ }
    setDrag({ cat, list: unpinned.slice() });
  };

  const moveDrag = (e) => {
    if (!drag || !listRef.current) return;
    const rows = Array.from(listRef.current.querySelectorAll('[data-drag-row]'));
    const y = e.clientY;
    let target = drag.list.length - 1;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) { target = i; break; }
    }
    const next = moveInList(drag.list, drag.cat, target);
    if (next !== drag.list) setDrag({ ...drag, list: next });
  };

  const endDrag = () => {
    if (!drag) return;
    const changed = drag.list.join('|') !== unpinned.join('|');
    // Persist before clearing drag so both state updates batch into one render
    // (no flash back to the old order).
    if (changed) persist([...pinned, ...drag.list], pinnedList);
    setDrag(null);
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

    return (
      <div key={cat} data-drag-row style={{
        padding: '0.75rem',
        backgroundColor: 'var(--bg-input)',
        borderRadius: 'var(--radius-md)',
        opacity: isDragging ? 0.6 : 1,
        boxShadow: isDragging ? 'var(--shadow-lg)' : 'none',
        transition: drag ? 'none' : 'box-shadow 0.2s ease',
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
            {(isOver || isWarning) && <AlertTriangle size={14} color={isOver ? 'var(--danger)' : '#f59e0b'} />}
            <div className="flex-col" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: isOver ? 'var(--danger)' : isWarning ? '#f59e0b' : 'var(--text-main)',
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
              style={{
                background: 'none',
                border: 'none',
                padding: '0.15rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: isPinnedRow ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              <Pin size={15} fill={isPinnedRow ? 'currentColor' : 'none'} />
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
                ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
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

  return (
    <div className="glass-card flex-col gap-4">
      <div className="flex items-center justify-between" style={{ gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem' }}>Budget Tracker</h2>
        {(canReorder || pinned.length > 0) && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pin or drag to arrange</span>
        )}
      </div>
      <div className="flex-col gap-3">
        {pinned.map(cat => renderRow(cat, true))}
        {pinned.length > 0 && unpinnedDisplay.length > 0 && (
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.1rem 0' }} />
        )}
        <div ref={listRef} className="flex-col gap-3">
          {unpinnedDisplay.map(cat => renderRow(cat, false))}
        </div>
      </div>
    </div>
  );
};

export default BudgetProgress;
