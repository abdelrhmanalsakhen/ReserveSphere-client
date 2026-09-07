import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { apiErrorMessage } from '../lib/format';

export function Loading({ label = 'Loading' }) {
  return (
    <div className="text-center text-muted py-5">
      <Spinner animation="border" size="sm" className="me-2" />
      {label}...
    </div>
  );
}

export function ErrorAlert({ error, onDismiss }) {
  const message = apiErrorMessage(error);
  if (!message) return null;
  return (
    <Alert variant="danger" dismissible={Boolean(onDismiss)} onClose={onDismiss} className="mb-3">
      <i className="bi bi-exclamation-triangle-fill me-2" />
      {message}
    </Alert>
  );
}

export function EmptyState({ icon = 'inbox', title, hint, children }) {
  return (
    <div className="rs-card text-center text-muted py-5 px-3">
      <i className={`bi bi-${icon} fs-1 d-block mb-2 opacity-50`} />
      <p className="fw-semibold mb-1 text-body">{title}</p>
      {hint && <p className="small mb-3">{hint}</p>}
      {children}
    </div>
  );
}
