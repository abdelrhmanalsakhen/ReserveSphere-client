import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useLoginMutation } from '../app/api';
import { credentialsReceived } from '../features/authSlice';
import { ErrorAlert } from '../components/Feedback';

const DEMO_ACCOUNTS = [
  { email: 'sarah@reservesphere.local', role: 'Employee' },
  { email: 'raya@reservesphere.local', role: 'Room admin' },
  { email: 'owner@reservesphere.local', role: 'System owner' },
];

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [login, { error, isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (event) => {
    event.preventDefault();
    try {
      const result = await login(form).unwrap();
      dispatch(credentialsReceived(result));
      navigate(location.state?.from || '/', { replace: true });
    } catch {
      /* surfaced by ErrorAlert */
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column flex-lg-row">
      <div className="rs-sidebar d-flex flex-column justify-content-center p-4 p-lg-5" style={{ flex: '0 0 42%', width: 'auto' }}>
        <div className="rs-brand h3">
          ReserveSphere
          <small className="d-block mt-1">MINISTRY OF TRANSPORT</small>
        </div>
        <p className="mt-3 mb-4 opacity-75">
          One platform for every meeting, training and conference room across the Ministry and its
          affiliated authorities.
        </p>
        <ul className="list-unstyled small opacity-75 mb-0">
          <li className="mb-2"><i className="bi bi-check2-circle text-teal me-2" />Real-time room availability</li>
          <li className="mb-2"><i className="bi bi-check2-circle text-teal me-2" />Automated approval workflow</li>
          <li className="mb-2"><i className="bi bi-check2-circle text-teal me-2" />No double bookings, ever</li>
        </ul>
      </div>

      <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4">
        <div className="rs-auth-panel w-100">
          <h1 className="h4 fw-bold mb-1">Sign in</h1>
          <p className="text-muted small mb-4">Use your Ministry e-mail address.</p>

          <ErrorAlert error={error} />

          <Form onSubmit={submit}>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label className="small fw-semibold">E-mail</Form.Label>
              <Form.Control
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-4" controlId="password">
              <Form.Label className="small fw-semibold">Password</Form.Label>
              <Form.Control
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Form.Group>
            <Button type="submit" className="w-100" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Form>

          <p className="small text-muted mt-4 mb-2">
            No account yet? <Link to="/register">Register</Link>
          </p>

          <div className="rs-card p-3 mt-3">
            <div className="rs-stat-label mb-2">Demo accounts - password Password123!</div>
            {DEMO_ACCOUNTS.map((account) => (
              <button
                type="button"
                key={account.email}
                className="btn btn-sm btn-outline-secondary w-100 text-start mb-1 d-flex justify-content-between"
                onClick={() => setForm({ email: account.email, password: 'Password123!' })}
              >
                <span>{account.email}</span>
                <span className="text-muted">{account.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
