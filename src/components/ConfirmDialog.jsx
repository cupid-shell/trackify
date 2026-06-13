import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, Trash2 } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  checkbox = null,
  onConfirm,
  onCancel
}) => {
  const [checkboxChecked, setCheckboxChecked] = useState(checkbox ? !!checkbox.defaultValue : false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCheckboxChecked(checkbox ? !!checkbox.defaultValue : false);
      // Let render happen first, then trigger entrance animation in next frame
      const timer = setTimeout(() => setAnimate(true), 20);
      return () => clearTimeout(timer);
    } else {
      setAnimate(false);
    }
  }, [isOpen, checkbox]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(checkboxChecked);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          icon: <AlertTriangle className="cd-icon" style={{ color: 'var(--warning)' }} />,
          btnClass: 'cd-btn-warning',
          accentColor: 'var(--warning)'
        };
      case 'info':
        return {
          icon: <Info className="cd-icon" style={{ color: 'var(--primary)' }} />,
          btnClass: 'cd-btn-info',
          accentColor: 'var(--primary)'
        };
      case 'danger':
      default:
        return {
          icon: <Trash2 className="cd-icon" style={{ color: 'var(--danger)' }} />,
          btnClass: 'cd-btn-danger',
          accentColor: 'var(--danger)'
        };
    }
  };

  const { icon, btnClass, accentColor } = getVariantStyles();

  return createPortal(
    <div className={`cd-overlay ${animate ? 'cd-show' : ''}`}>
      <style>{`
        .cd-overlay {
          position: fixed;
          inset: 0;
          z-index: 10002;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: rgba(7, 12, 10, 0);
          backdrop-filter: blur(0px);
          -webkit-backdrop-filter: blur(0px);
          transition: background 0.25s ease, backdrop-filter 0.25s ease;
        }
        .cd-overlay.cd-show {
          background: rgba(7, 12, 10, 0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        body.light-theme .cd-overlay.cd-show {
          background: rgba(226, 242, 233, 0.55);
        }
        .cd-card {
          width: 100%;
          max-width: 380px;
          padding: 1.75rem;
          border-radius: 20px;
          background: rgba(13, 25, 21, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 0, 0, 0.2);
          transform: scale(0.92) translateY(10px);
          opacity: 0;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cd-overlay.cd-show .cd-card {
          transform: scale(1) translateY(0);
          opacity: 1;
        }
        body.light-theme .cd-card {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(11, 26, 19, 0.08);
          border-top: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 12px 32px rgba(11, 26, 19, 0.08);
        }
        .cd-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        .cd-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        body.light-theme .cd-icon-wrapper {
          background: rgba(0, 0, 0, 0.02);
          border-color: rgba(0, 0, 0, 0.04);
        }
        .cd-icon {
          width: 22px;
          height: 22px;
        }
        .cd-title-area {
          flex: 1;
        }
        .cd-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-main);
          margin: 0 0 0.35rem 0;
          line-height: 1.2;
        }
        .cd-message {
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.45;
          margin: 0;
        }
        .cd-checkbox-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 1.25rem 0 0 0;
          padding: 0.75rem 1rem;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          cursor: pointer;
          user-select: none;
          transition: var(--transition);
        }
        .cd-checkbox-container:hover {
          border-color: ${accentColor};
          background: var(--bg-hover);
        }
        .cd-checkbox-input {
          cursor: pointer;
          accent-color: ${accentColor};
          width: 15px;
          height: 15px;
        }
        .cd-checkbox-label {
          font-size: 0.8rem;
          color: var(--text-main);
          cursor: pointer;
        }
        .cd-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.75rem;
        }
        .cd-btn {
          padding: 0.625rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 12px;
          cursor: pointer;
          transition: var(--transition);
        }
        .cd-btn-cancel {
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          color: var(--text-muted);
        }
        .cd-btn-cancel:hover {
          background: var(--bg-hover);
          color: var(--text-main);
        }
        .cd-btn-danger {
          background: linear-gradient(135deg, var(--danger) 0%, #e11d48 100%);
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(244, 63, 94, 0.25);
        }
        .cd-btn-danger:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(244, 63, 94, 0.35);
        }
        .cd-btn-warning {
          background: linear-gradient(135deg, var(--warning) 0%, #d97706 100%);
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
        }
        .cd-btn-warning:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(245, 158, 11, 0.35);
        }
        .cd-btn-info {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          color: white;
          border: none;
          box-shadow: 0 4px 12px var(--primary-glow);
        }
        .cd-btn-info:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px var(--primary-glow);
        }
      `}</style>
      <div className="cd-card">
        <div className="cd-header">
          <div className="cd-icon-wrapper">
            {icon}
          </div>
          <div className="cd-title-area">
            <h3 className="cd-title">{title}</h3>
            <p className="cd-message">{message}</p>
          </div>
        </div>

        {checkbox && (
          <label className="cd-checkbox-container">
            <input
              type="checkbox"
              className="cd-checkbox-input"
              checked={checkboxChecked}
              onChange={(e) => setCheckboxChecked(e.target.checked)}
            />
            <span className="cd-checkbox-label">{checkbox.label}</span>
          </label>
        )}

        <div className="cd-footer">
          <button className="cd-btn cd-btn-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={`cd-btn ${btnClass}`} onClick={handleConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;
