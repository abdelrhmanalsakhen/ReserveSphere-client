import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useRegisterMutation } from '../app/api';
import { credentialsReceived } from '../features/authSlice';
import { ErrorAlert } from '../components/Feedback';

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', department: '', password: '', confirm: '' });
  const [mismatch, setMismatch] = useState(false);
  const [register, { error, isLoading }] = useRegisterMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setMismatch(form.password !== form.confirm);
    if (form.password !== form.confirm) return;
    try {
      const { confirm, ...payload } = form;
      const result = await register(payload).unwrap();
      dispatch(credentialsReceived(result));
      navigate('/', { replace: true });
    } catch {
      /* surfaced by ErrorAlert */
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4">
      <div className="rs-card p-4 rs-auth-panel w-100">
        <h1 className="h4 fw-bold mb-1">Create an account</h1>
        <p className="text-muted small mb-4">New accounts start with the employee role.</p>

        <ErrorAlert error={error} />
        {mismatch && <div className="alert alert-warning py-2 small">The two passwords do not match.</div>}

        <Form onSubmit={submit}>
          <Form.Group className="mb-3" controlId="fullName">
            <Form.Label className="small fw-semibold">Full name</Form.Label>
            <Form.Control required minLength={2} value={form.fullName} onChange={update('fullName')} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="email">
            <Form.Label className="small fw-semibold">E-mail</Form.Label>
            <Form.Control type="email" required autoComplete="email" value={form.email} onChange={update('email')} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="department">
            <Form.Label className="small fw-semibold">Department <span className="text-muted fw-normal">(optional)</span></Form.Label>
            <Form.Control value={form.department} onChange={update('department')} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="password">
            <Form.Label className="small fw-semibold">Password</Form.Label>
            <Form.Control type="password" required minLength={8} value={form.password} onChange={update('password')} />
            <Form.Text muted>At least 8 characters.</Form.Text>
          </Form.Group>
          <Form.Group className="mb-4" controlId="confirm">
            <Form.Label className="small fw-semibold">Confirm password</Form.Label>
            <Form.Control type="password" required value={form.confirm} onChange={update('confirm')} />
          </Form.Group>
          <Button type="submit" className="w-100" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </Form>

        <p className="small text-muted mt-4 mb-0">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
