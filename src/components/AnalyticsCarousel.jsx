import { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Cover-flow 3D carousel.
 *  • Active card: center, full-size, neon glow border
 *  • Adjacent cards: scaled-down, darkened, partially visible — click to navigate
 *  • Arrow buttons + tab pills + dot indicators
 */
const AnalyticsCarousel = ({ slides }) => {
  const [current, setCurrent] = useState(0);
  const [trackHeight, setTrackHeight] = useState(480);
  const total = slides.length;
  const slideRefs = useRef([]);

  /* ── Circular offset ──────────────────────────────────── */
  const getOffset = useCallback((i) => {
    let d = ((i - current) % total + total) % total;
    if (d > total / 2) d -= total;
    return d;
  }, [current, total]);

  /* ── Navigate ─────────────────────────────────────────── */
  const go = useCallback((dir) => {
    setCurrent(c => (c + dir + total) % total);
  }, [total]);

  /* ── Keyboard ─────────────────────────────────────────── */
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowLeft')  go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [go]);

  /* ── Sync track height to active card ────────────────── */
  useLayoutEffect(() => {
    const el = slideRefs.current[current];
    if (!el) return;

    const sync = () => setTrackHeight(el.scrollHeight);
    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [current]);

  /* ── Per-offset visual style ──────────────────────────── */
  const posStyle = {
     0: { tx: '0%',    scale: 1,    opacity: 1,    zIndex: 10, brightness: 1,    events: 'auto',  cursor: 'default'  },
     1: { tx: '78%',   scale: 0.77, opacity: 0.55, zIndex: 6,  brightness: 0.4,  events: 'auto',  cursor: 'pointer'  },
    '-1':{ tx: '-78%', scale: 0.77, opacity: 0.55, zIndex: 6,  brightness: 0.4,  events: 'auto',  cursor: 'pointer'  },
     2: { tx: '136%',  scale: 0.60, opacity: 0.28, zIndex: 3,  brightness: 0.18, events: 'none',  cursor: 'default'  },
    '-2':{ tx: '-136%',scale: 0.60, opacity: 0.28, zIndex: 3,  brightness: 0.18, events: 'none',  cursor: 'default'  },
  };

  const buildStyle = (offset) => {
    const cfg = posStyle[offset] ?? {
      tx: `${offset > 0 ? 220 : -220}%`, scale: 0.45, opacity: 0, zIndex: 0, brightness: 0, events: 'none', cursor: 'default'
    };
    return {
      transform: `translateX(${cfg.tx}) scale(${cfg.scale})`,
      opacity: cfg.opacity,
      zIndex: cfg.zIndex,
      filter: cfg.brightness < 1 ? `brightness(${cfg.brightness})` : 'none',
      pointerEvents: cfg.events,
      cursor: cfg.cursor,
      transition: 'transform 0.52s cubic-bezier(0.4,0,0.2,1), opacity 0.52s ease, filter 0.52s ease',
    };
  };

  return (
    <div className="ac-root">

      {/* ── Cover-flow stage ───────────────────────────────── */}
      <div className="ac-stage" style={{ height: trackHeight }}>
        {slides.map((slide, i) => {
          const offset = getOffset(i);
          const isActive = offset === 0;

          return (
            <div
              key={i}
              ref={el => { slideRefs.current[i] = el; }}
              className={`ac-slide${isActive ? ' is-active' : ''}`}
              style={buildStyle(offset)}
              onClick={() => {
                if (offset === 1)  go(1);
                if (offset === -1) go(-1);
              }}
              aria-hidden={!isActive}
            >
              {slide.content}
            </div>
          );
        })}
      </div>

      {/* ── Arrow + pill nav bar ───────────────────────────── */}
      <div className="ac-nav-bar">
        <button className="ac-arrow-btn" onClick={() => go(-1)} aria-label="Previous">
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>

        <div className="ac-pills-scroll">
          {slides.map((s, i) => (
            <button
              key={i}
              className={`ac-pill${i === current ? ' active' : ''}`}
              onClick={() => setCurrent(i)}
            >
              <span className="ac-pill-icon">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        <button className="ac-arrow-btn" onClick={() => go(1)} aria-label="Next">
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Dot indicators ─────────────────────────────────── */}
      <div className="ac-dots-row">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`ac-dot${i === current ? ' active' : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={slides[i].label}
          />
        ))}
      </div>

    </div>
  );
};

export default AnalyticsCarousel;
