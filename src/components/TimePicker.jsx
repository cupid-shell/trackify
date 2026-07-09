import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { pad, parseTime, compose } from '../utils/time';

// A browser-agnostic time picker. Native <input type="time"> has no popup
// picker in Firefox (and its picker icon is WebKit-only), so this renders its
// own dropdown. Value in/out is 24-hour "HH:MM" — same as a native time input.
// The pad/parseTime/compose helpers live in ../utils/time so they're unit-tested.

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

const colStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  maxHeight: '168px',
  overflowY: 'auto',
  padding: '2px',
};

const TimePicker = ({ value, onChange, style, compact = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { h12, m, ampm } = parseTime(value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const cell = (active) => ({
    padding: '0.3rem 0.55rem',
    fontSize: '0.8rem',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    textAlign: 'center',
    minWidth: '2.2rem',
    backgroundColor: active ? 'var(--primary)' : 'transparent',
    color: active ? '#fff' : 'var(--text-main)',
    fontWeight: active ? 700 : 500,
  });

  return (
    <div ref={ref} style={{ position: 'relative', width: '150px', flexShrink: 0, ...style }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Choose time"
        style={{
          width: '100%',
          padding: compact ? '0.5rem 0.65rem' : '0.75rem',
          paddingRight: compact ? '1.9rem' : '2.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-input)',
          color: 'var(--text-main)',
          textAlign: 'left',
          position: 'relative',
          cursor: 'pointer',
          fontSize: compact ? '0.8rem' : '0.9rem',
        }}
      >
        {pad(h12)}:{pad(m)} {ampm}
        <Clock
          size={compact ? 14 : 16}
          style={{ position: 'absolute', right: compact ? '0.5rem' : '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            zIndex: 60,
            display: 'flex',
            gap: '4px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: '6px',
          }}
        >
          <div style={colStyle}>
            {HOURS.map((hh) => (
              <div key={hh} style={cell(hh === h12)} onClick={() => onChange(compose(hh, m, ampm))}>
                {hh}
              </div>
            ))}
          </div>
          <div style={colStyle}>
            {MINUTES.map((mm) => (
              <div key={mm} style={cell(mm === m)} onClick={() => onChange(compose(h12, mm, ampm))}>
                {pad(mm)}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '2px' }}>
            {['AM', 'PM'].map((a) => (
              <div key={a} style={cell(a === ampm)} onClick={() => onChange(compose(h12, m, a))}>
                {a}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker;
