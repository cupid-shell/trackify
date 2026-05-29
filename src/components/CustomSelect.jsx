import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({ 
  options, 
  value, 
  onChange, 
  getCategoryStyle, 
  placeholder = 'Select option...',
  label = '', 
  style = {},
  triggerClassName = '',
  triggerStyle = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile]);

  // Normalize options to objects: { value, label, emoji, color }
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'string') {
      if (opt === 'All') {
        return {
          value: 'All',
          label: 'All Categories',
          emoji: '🔍',
          color: null
        };
      }
      const catStyle = getCategoryStyle ? getCategoryStyle(opt) : null;
      return {
        value: opt,
        label: opt,
        emoji: catStyle?.emoji || null,
        color: catStyle?.color || null
      };
    }
    return {
      value: opt.value,
      label: opt.label || opt.value,
      emoji: opt.emoji || null,
      color: opt.color || null
    };
  });

  const selectedOpt = normalizedOptions.find(o => o.value === value) || normalizedOptions[0];

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="cs-container" ref={containerRef} style={style}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`cs-trigger ${triggerClassName}`}
        style={triggerStyle}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="cs-trigger-value">
          {selectedOpt?.emoji && <span className="cs-trigger-emoji">{selectedOpt.emoji}</span>}
          <span className="cs-trigger-text">{selectedOpt?.label || placeholder}</span>
        </span>
        <ChevronDown size={16} className={`cs-arrow ${isOpen ? 'open' : ''}`} />
      </button>

      {/* Floating Dropdown Menu (Desktop) */}
      {!isMobile && isOpen && (
        <div className="cs-dropdown animate-fade-in">
          {normalizedOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`cs-option ${opt.value === value ? 'selected' : ''}`}
              onClick={() => handleSelect(opt.value)}
            >
              <span className="cs-option-value">
                {opt.emoji && <span className="cs-option-emoji">{opt.emoji}</span>}
                <span className="cs-option-text">{opt.label}</span>
              </span>
              {opt.value === value && <Check size={14} className="cs-check" />}
            </button>
          ))}
        </div>
      )}

      {/* Slide-Up Bottom Sheet Modal (Mobile) */}
      {isMobile && isOpen && (
        <div className="cs-mobile-portal">
          <div className="cs-mobile-backdrop" onClick={() => setIsOpen(false)} />
          <div className="cs-bottom-sheet">
            <div className="cs-sheet-handle-bar">
              <div className="cs-sheet-handle" />
            </div>
            {label && <div className="cs-sheet-title">{label}</div>}
            <div className="cs-sheet-list">
              {normalizedOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`cs-sheet-option ${opt.value === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <span className="cs-option-value">
                    {opt.emoji && <span className="cs-option-emoji">{opt.emoji}</span>}
                    <span className="cs-option-text">{opt.label}</span>
                  </span>
                  {opt.value === value && (
                    <span className="cs-sheet-check-wrapper">
                      <Check size={15} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
