import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Nav from 'react-bootstrap/Nav';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import { useDecideReservationMutation, useReservationsQuery } from '../app/api';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorAlert, Loading } from '../components/Feedback';
import { formatDate, formatSlot } from '../lib/format';

const DIALOGS = {
  reject: {
    title: 'Reject this request',
    hint: 'The requester sees this note, so explain why the room is not available.',
    confirm: 'Reject request',
    variant: 'danger',
    noteRequired: true,
  },
  override: {
    title: 'Emergency override',
    hint: 'This approves the request and releases every approved booking that collides with it. Each displaced requester is notified.',
    confirm: 'Override and approve',
    variant: 'warning',
    noteRequired: true,
  },
};

export default function Approvals() {
  const [tab, setTab] = useState('inbox');
  const [dialog, setDialog] = useState(null);
  const [note, setNote] = useState('');

  const { data, isLoading, error } = useReservationsQuery(
    tab === 'inbox' ? { scope: 'inbox' } : { scope: 'all' }
  );
  const [decide, { isLoading: deciding, error: decideError }] = useDecideReservationMutation();

  const reservations = data?.reservations || [];

  const openDialog = (reservation, action) => {
    setNote('');
    setDialog({ reservation, action });
  };

  const runDecision = async (reservation, action, decisionNote) => {
    try {
      await decide({ id: reservation.id, action, note: decisionNote || undefined }).unwrap();
      setDialog(null);
    } catch {
      /* surfaced by ErrorAlert */
    }
  };

  const config = dialog ? DIALOGS[dialog.action] : null;

  return (
    <>
      <Nav variant="pills" activeKey={tab} onSelect={setTab} className="rs-card p-1 gap-1 mb-3 d-inline-flex">
        <Nav.Item><Nav.Link eventKey="inbox" className="py-1 px-3 small">Awaiting decision</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="all" className="py-1 px-3 small">All requests</Nav.Link></Nav.Item>
      </Nav>

      <ErrorAlert error={error || decideError} />
      {isLoading && <Loading label="Loading requests" />}

      {!isLoading && reservations.length === 0 && (
        <EmptyState
          icon="check2-circle"
          title={tab === 'inbox' ? 'No requests are waiting' : 'No requests yet'}
          hint="Requests for the rooms you administer appear here."
        />
      )}

      {reservations.length > 0 && (
        <div className="rs-card p-0 overflow-hidden">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-light">
              <tr className="rs-stat-label">
                <th className="ps-3">Request</th>
                <th>Requester</th>
                <th>When</th>
                <th>Status</th>
                <th className="text-end pe-3">Decision</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td className="ps-3">
                    <div className="fw-semibold small">
                      {reservation.title}
                      {reservation.priority === 'high' && <Badge bg="warning" text="dark" className="ms-2">High priority</Badge>}
                    </div>
                    <div className="small text-muted">{reservation.room_name} · {reservation.floor}</div>
                    {reservation.purpose && <div className="small text-muted fst-italic">{reservation.purpose}</div>}
                    {reservation.attendee_count && (
                      <div className="small text-muted">
                        <i className="bi bi-people me-1" />{reservation.attendee_count} of {reservation.capacity} seats
                      </div>
                    )}
                  </td>
                  <td className="small">
                    <div>{reservation.requester_name}</div>
                    <div className="text-muted">{reservation.requester_department || reservation.requester_email}</div>
                  </td>
                  <td className="small">
                    <div>{formatDate(reservation.starts_at)}</div>
                    <div className="text-muted">{formatSlot(reservation.starts_at, reservation.ends_at)}</div>
                  </td>
                  <td>
                    <StatusBadge status={reservation.status} />
                    {reservation.decided_by_name && (
                      <div className="small text-muted mt-1">by {reservation.decided_by_name}</div>
                    )}
                  </td>
                  <td className="text-end pe-3">
                    {reservation.status === 'pending' ? (
                      <div className="d-inline-flex gap-1">
                        <Button size="sm" onClick={() => runDecision(reservation, 'approve')} disabled={deciding}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline-danger" onClick={() => openDialog(reservation, 'reject')}>
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-warning"
                          title="Clear conflicting bookings and approve"
                          onClick={() => openDialog(reservation, 'override')}
                        >
                          <i className="bi bi-lightning-charge" />
                        </Button>
                      </div>
                    ) : (
                      <span className="small text-muted">{reservation.decision_note || 'No note'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={Boolean(dialog)} onHide={() => setDialog(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6">{config?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted">{config?.hint}</p>
          <div className="rs-card p-2 mb-3 small">
            <strong>{dialog?.reservation.title}</strong>
            <div className="text-muted">
              {dialog?.reservation.room_name} · {formatDate(dialog?.reservation.starts_at)} ·{' '}
              {formatSlot(dialog?.reservation.starts_at, dialog?.reservation.ends_at)}
            </div>
          </div>
          <Form.Group controlId="note">
            <Form.Label className="small fw-semibold">Note {config?.noteRequired && '*'}</Form.Label>
            <Form.Control as="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </Form.Group>
          <ErrorAlert error={decideError} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setDialog(null)}>Back</Button>
          <Button
            variant={config?.variant}
            disabled={deciding || (config?.noteRequired && note.trim().length < 3)}
            onClick={() => runDecision(dialog.reservation, dialog.action, note)}
          >
            {deciding ? 'Working...' : config?.confirm}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
