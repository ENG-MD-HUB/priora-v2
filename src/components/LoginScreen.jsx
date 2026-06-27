// LoginScreen.jsx
// شاشة تسجيل الدخول / إنشاء حساب — نسخة مُعاد كتابتها بوضوح من المكوّن `Ut` بالكود الأصلي.
//
// ملاحظة محفوظة من الأصل (وليست خطأ مني): زر "Forgot password?" غير مكتمل التنفيذ
// بالكود الأصلي — يعرض رسالة "implement sendPasswordResetEmail" بدل تنفيذ الإرسال
// الفعلي. هذا محفوظ كما هو بدون "تصحيح"، لأن هدفنا نقل المنطق، مش تعديله.

import { useState } from 'react';
import { authService as realAuthService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { showToast } from '../store/toastStore';
import { AnimatedBackground } from './AnimatedBackground';
import { APP_TAGLINE } from '../utils/appConstants';

// ملاحظة: prop اختياري `authService` أضيف فقط لتسهيل الاختبار بدون اتصال Firebase
// حقيقي (انظر TestHarness.jsx). بالاستخدام الطبيعي (بدون تمرير أي prop)، يستخدم
// authService الحقيقي تماماً كما بالكود الأصلي — لا تغيير بالسلوك الفعلي.
export function LoginScreen({ authService = realAuthService } = {}) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const setUser = useAuthStore((s) => s.setUser);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const user =
        mode === 'signin'
          ? await authService.signIn(email, password)
          : await authService.register(email, password, displayName);
      setUser(user);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setSubmitting(true);
    try {
      setUser(await authService.signInWithGoogle());
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Google sign-in failed', 'err');
    } finally {
      setSubmitting(false);
    }
  }

  function handleForgotPassword() {
    if (!email) {
      setErrorMsg('Enter your email first');
      return;
    }
    // محفوظ كما هو بالأصل — ميزة استرجاع كلمة المرور غير مكتملة التنفيذ فعلياً.
    showToast('Password reset sent (implement sendPasswordResetEmail)');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#010409',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <AnimatedBackground />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: 'radial-gradient(ellipse at center, transparent 20%, rgba(1,4,9,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1, margin: '0 16px' }}>
        <div
          style={{
            background: 'rgba(15,24,41,0.92)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            backdropFilter: 'blur(12px)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '28px 28px 20px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <img
                src="/logo-night.png"
                alt="Priora"
                style={{ height: 42, objectFit: 'contain', display: 'block', margin: '0 auto' }}
              />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>
              {APP_TAGLINE}
            </p>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {['signin', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setErrorMsg('');
                }}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  border: 'none',
                  background: 'none',
                  fontFamily: 'var(--font)',
                  fontSize: 13,
                  fontWeight: mode === m ? 600 : 400,
                  color: mode === m ? 'var(--accent)' : 'var(--text3)',
                  borderBottom: `2px solid ${mode === m ? 'var(--accent)' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {m === 'signin' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
            {mode === 'register' && (
              <div className="field">
                <label className="label">Full Name</label>
                <input
                  className="input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                  type="text"
                  autoComplete="name"
                  autoFocus={mode === 'register'}
                />
              </div>
            )}

            <div className="field">
              <label className="label">Email</label>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                autoComplete="email"
                autoFocus={mode === 'signin'}
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Password</label>
              <input
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'signin' && (
              <div style={{ textAlign: 'end', marginTop: 6 }}>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 12,
                    color: 'var(--text3)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font)',
                    textDecoration: 'underline',
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {errorMsg && (
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--red)',
                  marginTop: 10,
                  padding: '6px 10px',
                  background: 'var(--red-bg)',
                  borderRadius: 6,
                }}
              >
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                marginTop: 14,
                padding: '10px 0',
                borderRadius: 8,
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                fontFamily: 'var(--font)',
                fontSize: 14,
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                transition: 'opacity .15s',
              }}
            >
              {submitting ? '…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '9px 0',
                borderRadius: 8,
                background: 'var(--surface2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                fontFamily: 'var(--font)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background .15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface3)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
          Priora v2.0
        </p>
      </div>
    </div>
  );
}
