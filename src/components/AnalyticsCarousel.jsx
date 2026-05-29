import { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Carousel with two rendering modes:
 *  - Mobile (< 640px): CSS scroll-snap, no JS translation needed.
 *    The stage is overflow-x: auto with scroll-snap-type: x mandatory.
 *    Each card is exactly 100% of the stage width (set in CSS).
 *    Arrows call scrollTo on the stage. Dots scroll to the right panel.
 *  - Desktop (>= 640px): JS cover-flow translateX carousel (unchanged).
 */
const AnalyticsCarousel = ({ slides }) => {
  const [current, setCurrent]       = useState(0);
  const [trackOffset, setTrackOffset] = useState(0);
  const [stageWidth, setStageWidth]   = useState(null); // null = not yet measured

  const stageRef = useRef(null);
  const total    = slides.length;

  const CARD_FRAC = 0.78;
  const GAP_FRAC  = 0.025;

  // ── Desktop offset calc ─────────────────────────────────────
  const calcOffset = useCallback(() => {
    if (!stageRef.current) return;
    const stageW = stageRef.current.offsetWidth;
    setStageWidth(stageW);

    if (stageW < 640) {
      // Mobile: CSS scroll-snap handles layout — just track the active index
      setTrackOffset(0);
    } else {
      const cardW = stageW * CARD_FRAC;
      const gap   = stageW * GAP_FRAC;
      const peek  = (stageW - cardW) / 2;
      setTrackOffset(peek - current * (cardW + gap));
    }
  }, [current]);

  useLayoutEffect(() => { calcOffset(); }, [calcOffset]);

  useEffect(() => {
    if (!stageRef.current) return;
    const ro = new ResizeObserver(calcOffset);
    ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, [calcOffset]);

  // ── Navigation ───────────────────────────────────────────────
  const isMobileMode = stageWidth !== null && stageWidth < 640;

  const scrollMobileTo = useCallback((idx) => {
    if (!stageRef.current) return;
    const w = stageRef.current.offsetWidth;
    stageRef.current.scrollTo({ left: idx * w, behavior: 'smooth' });
  }, []);

  const go = useCallback((dir) => {
    const next = (current + dir + total) % total;
    setCurrent(next);
    if (isMobileMode) scrollMobileTo(next);
  }, [current, total, isMobileMode, scrollMobileTo]);

  // Sync dot indicator when user swipe-scrolls on mobile
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !isMobileMode) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.offsetWidth);
      if (idx !== current) setCurrent(idx);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [isMobileMode, current]);

  // Keyboard arrows (desktop only)
  useEffect(() => {
    if (isMobileMode) return;
    const h = (e) => {
      if (e.key === 'ArrowLeft')  go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [go, isMobileMode]);

  // ── Desktop card styles ──────────────────────────────────────
  const cardStyle = (diff) => {
    const abs = Math.abs(diff);
    if (abs === 0) return { transform: 'scale(1)',    opacity: 1,    filter: 'none',             zIndex: 10, cursor: 'default' };
    if (abs === 1) return { transform: 'scale(0.87)', opacity: 0.44, filter: 'brightness(0.35)',  zIndex: 6,  cursor: 'pointer' };
    if (abs === 2) return { transform: 'scale(0.75)', opacity: 0.24, filter: 'brightness(0.18)',  zIndex: 3,  cursor: 'default' };
    return               { transform: 'scale(0.65)', opacity: 0,    filter: 'brightness(0.1)',   zIndex: 1,  cursor: 'default' };
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="ac-root">

      <div className="ac-stage-wrap">

        <button className="ac-float-arrow ac-float-arrow--left" onClick={() => go(-1)} aria-label="Previous">
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>

        {/* Stage — switches between scroll-snap (mobile) and overflow:hidden (desktop) */}
        <div
          ref={stageRef}
          className={`ac-stage${isMobileMode ? ' ac-stage--mobile' : ''}`}
        >
          {isMobileMode ? (
            /* ── Mobile: each card is a native scroll-snap child ── */
            slides.map((slide, i) => (
              <div
                key={i}
                className={`ac-card ac-snap-card${i === current ? ' ac-card--active' : ''}`}
              >
                {slide.content}
              </div>
            ))
          ) : (
            /* ── Desktop: translateX cover-flow track ── */
            <div
              className="ac-track"
              style={{ transform: `translateX(${trackOffset}px)` }}
            >
              {slides.map((slide, i) => {
                const diff     = i - current;
                const isActive = diff === 0;
                const vstyle   = cardStyle(diff);
                const cardW    = stageWidth ? stageWidth * CARD_FRAC : 0;
                const gap      = stageWidth ? stageWidth * GAP_FRAC  : 0;

                return (
                  <div
                    key={i}
                    className={`ac-card${isActive ? ' ac-card--active' : ''}`}
                    style={{
                      flex:            `0 0 ${cardW}px`,
                      marginRight:     i < total - 1 ? `${gap}px` : 0,
                      ...vstyle,
                      transition:      'transform 0.48s cubic-bezier(0.4,0,0.2,1), opacity 0.48s ease, filter 0.48s ease',
                      transformOrigin: 'top center',
                    }}
                    onClick={() => { if (Math.abs(diff) === 1) go(diff > 0 ? 1 : -1); }}
                  >
                    {slide.content}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button className="ac-float-arrow ac-float-arrow--right" onClick={() => go(1)} aria-label="Next">
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="ac-dots-row">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`ac-dot${i === current ? ' active' : ''}`}
            onClick={() => {
              setCurrent(i);
              if (isMobileMode) scrollMobileTo(i);
            }}
            aria-label={slides[i].label}
          />
        ))}
      </div>

    </div>
  );
};

export default AnalyticsCarousel;
