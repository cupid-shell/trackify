const SplashScreen = () => (
  <div className="splash-root">
    <div className="splash-glow-ring" />
    <div className="splash-logo-wrap">
      <img src="/logo-mint.svg" alt="Trackify Logo" className="splash-icon" />
      <h1 className="splash-wordmark">Trackify</h1>
      <p className="splash-tagline">Your financial clarity, simplified.</p>
    </div>
    <div className="splash-dots">
      <span /><span /><span />
    </div>
  </div>
);

export default SplashScreen;
