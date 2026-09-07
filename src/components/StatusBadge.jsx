import Badge from 'react-bootstrap/Badge';
import { STATUS_META } from '../lib/format';

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, variant: 'secondary' };
  return <Badge bg={meta.variant} className="fw-semibold">{meta.label}</Badge>;
}
