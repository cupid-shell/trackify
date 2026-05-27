import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * AnalyticsCarousel
 * props:
 *   slides: Array<{ label: string, icon: string, content: ReactNode }>
 */
const AnalyticsCarousel = ({ slides }) => {
  const [current, setCurrent] = useState(0);
  const [animDir, setAnimDir] = useState(null); // 'left' | 'right' | null
  const [isAnimating, setIsAnimating] = useState(false);
  const tabsRef = useRef(null);

  const total = slides.length;

  const goTo = useCallback((index, dir) => {
    if (isAnimating || index === current) return;
    setAnimDir(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setIsAnimating(false);
      setAnimDir(null);
    }, 320);
  }, [current, isAnimating]);

  const prev = () => { if (current > 0) goTo(current - 1, 'right'); };
  const next = () => { if (current < total - 1) goTo(current + 1, 'left'); };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // Auto-scroll the active tab pill into view
  useEffect(() => {
    if (!tabsRef.current) return;
    const activePill = tabsRef.current.querySelector('.ac-pill.active');
    if (activePill) {
      activePill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [current]);

  const slideStyle = isAnimating
    ? {
        opacity: 0,
        transform: `translateX(${animDir === 'left' ? '-32px' : '32px'})`,
      }
    : {
        opacity: 1,
        transform: 'translateX(0)',
      };

  return (
    <div className="ac-wrapper">
      {/* ── Tab pill navigation ─────────────────────────────── */}
      <div className="ac-header">
        {/* Left arrow */}
        <button
          className="ac-arrow ac-arrow-left"
          onClick={prev}
          disabled={current === 0}
          aria-label="Previous card"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>

        {/* Scrollable pills */}
        <div className="ac-pills-track" ref={tabsRef}>
          {slides.map((slide, i) => (
            <button
              key={i}
              className={`ac-pill ${i === current ? 'active' : ''}`}
              onClick={() => goTo(i, i > current ? 'left' : 'right')}
            >
              <span className="ac-pill-icon">{slide.icon}</span>
              <span className="ac-pill-label">{slide.label}</span>
            </button>
          ))}
        </div>

        {/* Right arrow */}
        <button
          className="ac-arrow ac-arrow-right"
          onClick={next}
          disabled={current === total - 1}
          aria-label="Next card"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Counter ─────────────────────────────────────────── */}
      <div className="ac-counter">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`ac-dot ${i === current ? 'active' : ''}`}
            onClick={() => goTo(i, i > current ? 'left' : 'right')}
            aria-label={`Go to ${slides[i].label}`}
          />
        ))}
      </div>

      {/* ── Slide content ───────────────────────────────────── */}
      <div className="ac-stage" key={current} style={slideStyle}>
        {slides[current].content}
      </div>
    </div>
  );
};

export default AnalyticsCarousel;
