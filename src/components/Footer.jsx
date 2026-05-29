import { version } from '../../package.json';
import { useAppContext } from '../context/AppContext';

const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const GithubIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const Footer = () => {
  const { updateAvailable } = useAppContext();
  const apkUrl = updateAvailable?.downloadUrl || `https://github.com/cupid-shell/trackify/releases/download/v${version}/Trackify-v${version}.apk`;

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%  { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 1;   }
          100%{ transform: scale(0.9); opacity: 0.6; }
        }
        .pulse-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          background-color: var(--success);
          border-radius: 50%;
          box-shadow: 0 0 6px var(--success);
          animation: pulse 2s infinite ease-in-out;
          flex-shrink: 0;
        }
        .premium-footer {
          padding: 0.6rem 2rem;
          margin-top: auto;
          border-top: 1px solid var(--border-color);
          background: var(--bg-header);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.6rem;
          font-size: 0.78rem;
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
          background: linear-gradient(90deg, transparent, var(--primary) 50%, transparent);
          opacity: 0.35;
        }
        .footer-left {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
        }
        .footer-brand-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .footer-brand {
          font-weight: 700;
          letter-spacing: 0.03em;
          color: var(--text-main);
          font-size: 0.85rem;
        }
        .footer-separator {
          color: var(--border-color);
          user-select: none;
          font-size: 0.65rem;
        }
        .footer-version-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background-color: var(--primary-glow);
          border: 1px solid var(--border-color);
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-full);
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--primary);
        }
        .footer-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .footer-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: var(--primary);
          color: #ffffff !important;
          padding: 0.35rem 0.85rem;
          border-radius: var(--radius-sm);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.75rem;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--shadow-glow);
        }
        .footer-btn-primary:hover {
          transform: translateY(-1px);
          background: var(--primary-hover);
          box-shadow: var(--shadow-glow);
        }
        .footer-btn-primary:active { transform: translateY(0); }
        .footer-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: var(--bg-input);
          color: var(--text-main) !important;
          border: 1px solid var(--border-color);
          padding: 0.35rem 0.85rem;
          border-radius: var(--radius-sm);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.75rem;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .footer-btn-secondary:hover {
          transform: translateY(-1px);
          background: var(--bg-hover);
          border-color: var(--border-color);
        }
        .footer-btn-secondary:active { transform: translateY(0); }

        @media (max-width: 768px) {
          .premium-footer {
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 1rem 1.25rem;
            gap: 0.75rem;
          }
          .footer-left {
            flex-direction: column;
            gap: 0.4rem;
            align-items: center;
          }
          .footer-brand-group { justify-content: center; }
          .footer-separator { display: none; }
          .footer-right {
            width: 100%;
            justify-content: center;
            gap: 0.5rem;
          }
          .footer-btn-primary, .footer-btn-secondary {
            flex: 1;
            justify-content: center;
            max-width: 160px;
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
