const SplashScreen = () => (
  <div className="splash-root">
    <div className="splash-glow-ring" />
    <div className="splash-logo-wrap">
      <svg className="splash-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill="url(#splashGrad)" />
        <path d="M14 34 L24 14 L34 34" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M18 26 H30" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        <circle cx="24" cy="36" r="2" fill="white" />
        <defs>
          <linearGradient id="splashGrad" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
      <h1 className="splash-wordmark">Trackify</h1>
      <p className="splash-tagline">Your financial clarity, simplified.</p>
    </div>
    <div className="splash-dots">
      <span /><span /><span />
    </div>
  </div>
);

export default SplashScreen;
