import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';
import { http, useDecideReservationMutation, useReservationsQuery } from '../app/api';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorAlert, Loading } from '../components/Feedback';
import { formatDate, formatSlot } from '../lib/format';

const TABS = [
  { key: 'upcoming', label: 'Upcoming', params: { status: 'approved', upcoming: 'true' } },
  { key: 'pending', label: 'Pending approval', params: { status: 'pending' } },
  { key: 'past', label: 'Past bookings', params: { past: 'true' } },
  { key: 'closed', label: 'Rejected & cancelled', params: {} },
];

const CLOSED_STATUSES = ['rejected', 'cancelled', 'overridden'];

export default function MyReservations() {
  const [tab, setTab] = useState('upcoming');
  const [toCancel, setToCancel] = useState(null);
  const token = useSelector((state) => state.auth.token);
  const active = TABS.find((t) => t.key === tab);

  const { data, isLoading, error } = useReservationsQuery({ scope: 'mine', ...active.params });
  const [decide, { isLoading: cancelling, error: cancelError }] = useDecideReservationMutation();

  const reservations = (data?.reservations || []).filter((r) =>
    tab === 'closed' ? CLOSED_STATUSES.includes(r.status) : !CLOSED_STATUSES.includes(r.status)
  );

  // A finished booking can no longer be moved or called off, so it offers no actions.
  const isChangeable = (reservation) =>
    ['pending', 'approved'].includes(reservation.status) && new Date(reservation.ends_at) > new Date();

  const confirmCancel = async () => {
    await decide({ id: toCancel.id, action: 'cancel' });
    setToCancel(null);
  };

  /** The .ics route needs the bearer token, so fetch it and hand the browser a blob. */
  const downloadIcs = async (reservation) => {
    const { data: blob } = await http.get(`/reservations/${reservation.id}/ics`, {
      responseType: 'blob',
      headers: { Authorization: `Bearer ${token}` },
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reservation-${reservation.id}.ics`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <Nav variant="pills" activeKey={tab} onSelect={setTab} className="rs-card p-1 gap-1">
          {TABS.map((item) => (
            <Nav.Item key={item.key}>
              <Nav.Link eventKey={item.key} className="py-1 px-3 small">{item.label}</Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
        <Button as={Link} to="/rooms" size="sm">
          <i className="bi bi-plus-lg me-1" />New reservation
        </Button>
      </div>

      <ErrorAlert error={error || cancelError} />
      {isLoading && <Loading label="Loading your reservations" />}

      {!isLoading && reservations.length === 0 && (
        <EmptyState icon="calendar-x" title="Nothing here yet" hint="Requests you submit will appear in this ledger.">
          <Button as={Link} to="/rooms" size="sm">Browse rooms</Button>
        </EmptyState>
      )}

      {reservations.length > 0 && (
        <div className="rs-card p-0 overflow-hidden">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-light">
              <tr className="rs-stat-label">
                <th className="ps-3">Room / space</th>
                <th>Date</th>
                <th>Time slot</th>
                <th>Status</th>
                <th className="text-end pe-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td className="ps-3">
                    <div className="fw-semibold small">{reservation.title}</div>
                    <div className="small text-muted">{reservation.room_name} · {reservation.floor}</div>
                    {reservation.decision_note && (
                      <div className="small text-muted fst-italic">
                        <i className="bi bi-chat-left-quote me-1" />{reservation.decision_note}
                      </div>
                    )}
                  </td>
                  <td className="small">{formatDate(reservation.starts_at)}</td>
                  <td className="small">{formatSlot(reservation.starts_at, reservation.ends_at)}</td>
                  <td><StatusBadge status={reservation.status} /></td>
                  <td className="text-end pe-3">
                    <div className="d-inline-flex gap-1">
                      {reservation.status === 'approved' && (
                        <Button size="sm" variant="outline-secondary" title="Add to calendar" onClick={() => downloadIcs(reservation)}>
                          <i className="bi bi-calendar-plus" />
                        </Button>
                      )}
                      {isChangeable(reservation) && (
                        <>
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            as={Link}
                            to={`/reserve/${reservation.room_id}?edit=${reservation.id}`}
                          >
                            Modify
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => setToCancel(reservation)}>
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={Boolean(toCancel)} onHide={() => setToCancel(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6">Cancel this reservation?</Modal.Title>
        </Modal.Header>
        <Modal.Body className="small">
          <strong>{toCancel?.title}</strong> in {toCancel?.room_name} on {formatDate(toCancel?.starts_at)} will be
          released. This cannot be undone - you would need to submit a new request.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setToCancel(null)}>Keep it</Button>
          <Button variant="danger" onClick={confirmCancel} disabled={cancelling}>
            {cancelling ? 'Cancelling...' : 'Cancel reservation'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
