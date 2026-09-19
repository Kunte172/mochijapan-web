import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerRequest } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const result = await registerRequest({
        email,
        password,
        displayName: displayName.trim() || undefined,
      });
      setAuth(result.user, result.accessToken);
      navigate('/learn', { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể đăng ký.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">MochiJapan</p>
        <h1>Tạo tài khoản</h1>
        <label>
          Tên hiển thị
          <input
            type="text"
            value={displayName}
            autoComplete="name"
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            value={password}
            autoComplete="new-password"
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button auth-submit" type="submit" disabled={submitting}>
          {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
        </button>
        <p>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
      </form>
    </section>
  );
}
