import { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AnalyticsCarousel = ({ slides }) => {
  const [current, setCurrent] = useState(0);
  const [trackOffset, setTrackOffset] = useState(0);
  const [stageH, setStageH] = useState('auto');

  const stageRef  = useRef(null);
  const trackRef  = useRef(null);
  const activeRef = useRef(null);
  const total     = slides.length;

  const CARD_FRAC = 0.78;
  const GAP_FRAC  = 0.025;

  const calcOffset = useCallback(() => {
    if (!stageRef.current) return;
    const stageW = stageRef.current.offsetWidth;
    const cardW  = stageW * CARD_FRAC;
    const gap    = stageW * GAP_FRAC;
    const peek   = (stageW - cardW) / 2;
    setTrackOffset(peek - current * (cardW + gap));
  }, [current]);

  const syncHeight = useCallback(() => {
    if (!activeRef.current) return;
    setStageH(activeRef.current.offsetHeight);
  }, []);

  useLayoutEffect(() => {
    calcOffset();
    syncHeight();
  }, [current, calcOffset, syncHeight]);

  useEffect(() => {
    if (!stageRef.current) return;
    const ro = new ResizeObserver(() => { calcOffset(); syncHeight(); });
    ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, [calcOffset, syncHeight]);

  useEffect(() => {
    if (!activeRef.current) return;
    const ro = new ResizeObserver(syncHeight);
    ro.observe(activeRef.current);
    return () => ro.disconnect();
  }, [current, syncHeight]);

  const go = useCallback((dir) => {
    setCurrent(c => (c + dir + total) % total);
  }, [total]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowLeft')  go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [go]);

  const cardStyle = (diff) => {
    const abs = Math.abs(diff);
    if (abs === 0) return { transform: 'scale(1)',    opacity: 1,    filter: 'none',            zIndex: 10, cursor: 'default' };
    if (abs === 1) return { transform: 'scale(0.86)', opacity: 0.42, filter: 'brightness(0.35)', zIndex: 6,  cursor: 'pointer' };
    if (abs === 2) return { transform: 'scale(0.74)', opacity: 0.22, filter: 'brightness(0.18)', zIndex: 3,  cursor: 'default' };
    return              { transform: 'scale(0.64)', opacity: 0,    filter: 'brightness(0.1)',  zIndex: 1,  cursor: 'default' };
  };

  return (
    <div className="ac-root">

      {/* ── Stage with STATIC side arrows overlaid ───────────── */}
      <div className="ac-stage-wrap">

        {/* Left floating arrow */}
        <button
          className="ac-float-arrow ac-float-arrow--left"
          onClick={() => go(-1)}
          aria-label="Previous card"
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>

        {/* Coverflow stage */}
        <div
          ref={stageRef}
          className="ac-stage"
          style={{ height: stageH !== 'auto' ? `${stageH}px` : 'auto' }}
        >
          <div
            ref={trackRef}
            className="ac-track"
            style={{ transform: `translateX(${trackOffset}px)` }}
          >
            {slides.map((slide, i) => {
              const diff     = i - current;
              const isActive = diff === 0;
              const vstyle   = cardStyle(diff);
              const stageW   = stageRef.current ? stageRef.current.offsetWidth : 0;
              const cardW    = stageW * CARD_FRAC || '78%';
              const gap      = stageW * GAP_FRAC  || '2.5%';

              return (
                <div
                  key={i}
                  ref={isActive ? activeRef : null}
                  className={`ac-card${isActive ? ' ac-card--active' : ''}`}
                  style={{
                    flex:            `0 0 ${typeof cardW === 'number' ? cardW + 'px' : cardW}`,
                    marginRight:     i < total - 1
                                       ? (typeof gap === 'number' ? `${gap}px` : gap)
                                       : 0,
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
        </div>

        {/* Right floating arrow */}
        <button
          className="ac-float-arrow ac-float-arrow--right"
          onClick={() => go(1)}
          aria-label="Next card"
        >
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Pill tab nav (no arrows here) ────────────────────── */}
      <div className="ac-nav-bar">
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
      </div>

      {/* ── Dot indicators ───────────────────────────────────── */}
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
