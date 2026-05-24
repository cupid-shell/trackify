import React from 'react';
import { version } from '../../package.json';

const Footer = () => {
  const apkUrl = `https://github.com/cupid-shell/trackify/releases/download/v${version}/Trackify-v${version}.apk`;

  return (
    <footer style={{
      padding: '2rem 1rem',
      marginTop: 'auto',
      borderTop: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-card)',
      textAlign: 'center',
      fontSize: '0.875rem',
      color: 'var(--text-muted)'
    }}>
      <p style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
        <span>&copy; {new Date().getFullYear()} Cupid Shell. All rights reserved.</span>
        <span style={{ fontSize: '0.75rem', opacity: 0.8, color: 'var(--primary)' }}>Version {version}</span>
      </p>
      <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <a href={apkUrl}
           style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <span>📥 Download Android APK</span>
        </a>
        <span style={{ color: 'var(--border-color)' }}>|</span>
        <a href="https://github.com/cupid-shell/trackify" target="_blank" rel="noopener noreferrer"
           style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <span>💻 GitHub Repo</span>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
