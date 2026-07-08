import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Login = () => {
  const { showToast } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        showToast('Check your email for the confirmation link!', 'info');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'var(--bg-main)',
      backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)',
      backgroundSize: '32px 32px'
    }}>
      <div className="glass-card flex-col gap-6" style={{ 
        width: '100%', 
        maxWidth: '380px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div className="flex-col items-center gap-2" style={{ textAlign: 'center' }}>
          <img 
            src="/logo-mint.svg" 
            alt="Trackify Logo" 
            style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: 'var(--radius-md)', 
              boxShadow: 'var(--shadow-glow)',
              marginBottom: '0.75rem',
              border: '1px solid rgb(from var(--primary) r g b / 0.3)'
            }} 
          />
          <h1 style={{ 
            fontSize: '2rem',
            fontFamily: "'Hubot Sans Variable', sans-serif",
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#ffffff'
          }}>
            TRACKIFY
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Sign in to sync your expenses securely.
          </p>
        </div>

        {error && (
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: 'var(--danger-bg)', 
            color: 'var(--danger)', 
            borderRadius: 'var(--radius-md)', 
            fontSize: '0.8rem',
            border: '1px solid rgba(255, 123, 114, 0.15)',
            fontFamily: "'Mona Sans Variable', sans-serif"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.35rem', 
              color: 'var(--text-muted)', 
              fontSize: '0.8rem',
              fontFamily: "'Hubot Sans Variable', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.02em'
            }}>
              EMAIL ADDRESS
            </label>
            <div className="input-icon-wrapper">
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{ 
                  paddingLeft: '2.5rem',
                  fontSize: '0.85rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.35rem', 
              color: 'var(--text-muted)', 
              fontSize: '0.8rem',
              fontFamily: "'Hubot Sans Variable', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.02em'
            }}>
              PASSWORD
            </label>
            <div className="input-icon-wrapper">
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ 
                  paddingLeft: '2.5rem',
                  fontSize: '0.85rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)'
                }}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: 'var(--primary)',
              color: '#07090e',
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontFamily: "'Hubot Sans Variable', sans-serif",
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '0.5rem',
              boxShadow: 'var(--shadow-glow)',
              opacity: loading ? 0.7 : 1,
              transition: 'var(--transition)'
            }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            style={{ 
              color: 'var(--primary)', 
              fontWeight: 700, 
              fontFamily: "'Hubot Sans Variable', sans-serif",
              fontSize: '0.8rem',
              textDecoration: 'none',
              marginLeft: '0.25rem'
            }}
          >
            {isLogin ? 'SIGN UP' : 'SIGN IN'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
