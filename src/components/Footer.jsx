import React from 'react';

const Footer = () => {
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
      <p style={{ margin: 0 }}>
        &copy; {new Date().getFullYear()} Cupid Shell. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
