import Dropdown from 'react-bootstrap/Dropdown';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '../app/api';
import { formatDateTime } from '../lib/format';

export default function NotificationBell() {
  // Approvals happen elsewhere, so the bell polls rather than waiting for a reload.
  const { data } = useNotificationsQuery(undefined, { pollingInterval: 60000 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const notifications = data?.notifications || [];
  const unread = data?.unread || 0;

  return (
    <Dropdown align="end">
      <Dropdown.Toggle variant="light" className="border position-relative" id="notifications">
        <i className="bi bi-bell" />
        {unread > 0 && (
          <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle">
            {unread}
          </Badge>
        )}
      </Dropdown.Toggle>
      <Dropdown.Menu className="shadow" style={{ width: 340, maxHeight: 420, overflowY: 'auto' }}>
        <div className="d-flex align-items-center justify-content-between px-3 py-2">
          <span className="fw-semibold">Notifications</span>
          {unread > 0 && (
            <Button variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => markAllRead()}>
              Mark all read
            </Button>
          )}
        </div>
        <Dropdown.Divider className="my-0" />
        {notifications.length === 0 && <p className="text-muted small text-center py-4 mb-0">No notifications yet.</p>}
        {notifications.map((n) => (
          <button
            type="button"
            key={n.id}
            className={`dropdown-item text-wrap py-2 ${n.is_read ? '' : 'rs-notification-unread'}`}
            onClick={() => !n.is_read && markRead(n.id)}
          >
            <div className="d-flex justify-content-between gap-2">
              <span className="fw-semibold small">{n.subject}</span>
              {!n.is_read && <span className="text-teal small">new</span>}
            </div>
            <div className="small text-muted">{n.body}</div>
            <div className="small text-muted opacity-75">{formatDateTime(n.created_at)}</div>
          </button>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
