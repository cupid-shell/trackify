import React from 'react';
import { version } from '../../package.json';

const DownloadIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block' }}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const GithubIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block' }}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const Footer = () => {
  const apkUrl = `https://github.com/cupid-shell/trackify/releases/download/v${version}/Trackify-v${version}.apk`;

  return (
    <>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
        .pulse-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          background-color: var(--success);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--success);
          animation: pulse 2s infinite ease-in-out;
        }
        .premium-footer {
          padding: 1.25rem 2rem;
          margin-top: auto;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          background: linear-gradient(180deg, rgba(28, 31, 38, 0.7) 0%, rgba(15, 17, 21, 0.9) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.5rem;
          font-size: 0.85rem;
          color: var(--text-muted);
          position: relative;
          transition: var(--transition);
        }
        .premium-footer::before {
          content: '';
          position: absolute;
          top: -1px;
          left: 10%;
          right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3) 50%, transparent);
        }
        .footer-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .footer-brand-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .footer-brand {
          font-weight: 700;
          letter-spacing: 0.03em;
          background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-size: 0.95rem;
        }
        .footer-separator {
          color: rgba(255, 255, 255, 0.12);
          user-select: none;
        }
        .footer-version-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.18);
          padding: 0.25rem 0.65rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
          color: #a5b4fc;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.05);
        }
        .footer-right {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .footer-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #ffffff !important;
          padding: 0.55rem 1.15rem;
          border-radius: var(--radius-sm);
          text-decoration: none;
          font-weight: 600;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        .footer-btn-primary:hover {
          transform: translateY(-2px);
          background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        .footer-btn-primary:active {
          transform: translateY(0);
        }
        .footer-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-main) !important;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0.55rem 1.15rem;
          border-radius: var(--radius-sm);
          text-decoration: none;
          font-weight: 500;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .footer-btn-secondary:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        .footer-btn-secondary:active {
          transform: translateY(0);
        }

        @media (max-width: 768px) {
          .premium-footer {
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 1.75rem 1.5rem;
            gap: 1.25rem;
          }
          .footer-left {
            flex-direction: column;
            gap: 0.6rem;
            align-items: center;
          }
          .footer-brand-group {
            justify-content: center;
          }
          .footer-separator {
            display: none;
          }
          .footer-right {
            width: 100%;
            justify-content: center;
            gap: 0.75rem;
          }
          .footer-btn-primary, .footer-btn-secondary {
            flex: 1;
            justify-content: center;
            max-width: 180px;
            font-size: 0.8rem;
            padding: 0.5rem 0.9rem;
          }
        }
      `}</style>

      <footer className="premium-footer">
        <div className="footer-left">
          <div className="footer-brand-group">
            <span className="footer-brand">Cupid Shell</span>
            <div className="footer-version-badge">
              <span className="pulse-dot"></span>
              <span>v{version}</span>
            </div>
          </div>
          <span className="footer-separator">•</span>
          <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
        </div>

        <div className="footer-right">
          <a
            href={apkUrl}
            className="footer-btn-primary"
            title={`Download Trackify Android APK v${version}`}
          >
            <DownloadIcon />
            <span>Download APK</span>
          </a>

          <a
            href="https://github.com/cupid-shell/trackify"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-btn-secondary"
            title="View Trackify GitHub Repository"
          >
            <GithubIcon />
            <span>GitHub Repo</span>
          </a>
        </div>
      </footer>
    </>
  );
};

export default Footer;
