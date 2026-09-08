import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import {
  useCreateRoomMutation,
  useDeleteRoomMutation,
  useRoomsQuery,
  useUpdateRoomMutation,
  useUsersQuery,
} from '../app/api';
import { EmptyState, ErrorAlert, Loading } from '../components/Feedback';

const BLANK = { name: '', description: '', floor: '', location: '', capacity: 8, amenities: '', pricePerHour: '', adminId: '' };

const toForm = (room) => ({
  name: room.name,
  description: room.description || '',
  floor: room.floor || '',
  location: room.location || '',
  capacity: room.capacity,
  amenities: (room.amenities || []).join(', '),
  pricePerHour: room.price_per_hour || '',
  adminId: room.admin_id || '',
});

export default function ManageRooms() {
  // Owners manage rooms that are out of service too, so they must appear in this list.
  const { data, isLoading, error } = useRoomsQuery({ includeInactive: 'true' });
  const { data: usersData } = useUsersQuery();
  const [createRoom, createState] = useCreateRoomMutation();
  const [updateRoom, updateState] = useUpdateRoomMutation();
  const [deleteRoom, deleteState] = useDeleteRoomMutation();

  const [editing, setEditing] = useState(null); // null | { id? }
  const [form, setForm] = useState(BLANK);
  const [toDelete, setToDelete] = useState(null);

  const admins = (usersData?.users || []).filter((user) => user.role !== 'employee');
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const openCreate = () => {
    setForm(BLANK);
    setEditing({});
  };
  const openEdit = (room) => {
    setForm(toForm(room));
    setEditing(room);
  };

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      description: form.description || undefined,
      floor: form.floor || undefined,
      location: form.location || undefined,
      capacity: Number(form.capacity),
      amenities: form.amenities.split(',').map((a) => a.trim()).filter(Boolean),
      pricePerHour: form.pricePerHour === '' ? null : Number(form.pricePerHour),
      adminId: form.adminId === '' ? null : Number(form.adminId),
    };
    try {
      if (editing.id) await updateRoom({ id: editing.id, ...payload }).unwrap();
      else await createRoom(payload).unwrap();
      setEditing(null);
    } catch {
      /* surfaced by ErrorAlert */
    }
  };

  const confirmDelete = async () => {
    await deleteRoom(toDelete.id);
    setToDelete(null);
  };

  const rooms = data?.rooms || [];
  const saving = createState.isLoading || updateState.isLoading;

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <p className="small text-muted mb-0">
          Create rooms, edit their details, and assign the room admin who approves their requests.
        </p>
        <Button size="sm" onClick={openCreate}><i className="bi bi-plus-lg me-1" />Add room</Button>
      </div>

      <ErrorAlert error={error || deleteState.error} />
      {isLoading && <Loading label="Loading rooms" />}

      {!isLoading && rooms.length === 0 && (
        <EmptyState icon="building-add" title="No rooms yet" hint="Add the first meeting space to get started.">
          <Button size="sm" onClick={openCreate}>Add room</Button>
        </EmptyState>
      )}

      {rooms.length > 0 && (
        <div className="rs-card p-0 overflow-hidden">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-light">
              <tr className="rs-stat-label">
                <th className="ps-3">Room</th>
                <th>Location</th>
                <th className="text-end">Seats</th>
                <th>Amenities</th>
                <th>Room admin</th>
                <th className="text-end pe-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td className="ps-3">
                    <div className="fw-semibold small">{room.name}</div>
                    {!room.is_active && <Badge bg="secondary">Out of service</Badge>}
                  </td>
                  <td className="small text-muted">{room.floor} · {room.location}</td>
                  <td className="text-end small">{room.capacity}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-1" style={{ maxWidth: 240 }}>
                      {room.amenities.map((amenity) => <span className="rs-amenity" key={amenity}>{amenity}</span>)}
                    </div>
                  </td>
                  <td className="small">{room.admin_name || <span className="text-muted">Unassigned</span>}</td>
                  <td className="text-end pe-3">
                    <div className="d-inline-flex gap-1">
                      <Button size="sm" variant="outline-secondary" onClick={() => openEdit(room)}>Edit</Button>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        title={room.is_active ? 'Take out of service' : 'Put back in service'}
                        onClick={() => updateRoom({ id: room.id, isActive: !room.is_active })}
                      >
                        <i className={`bi bi-${room.is_active ? 'pause' : 'play'}`} />
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => setToDelete(room)}>
                        <i className="bi bi-trash" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={Boolean(editing)} onHide={() => setEditing(null)} centered size="lg">
        <Form onSubmit={submit}>
          <Modal.Header closeButton>
            <Modal.Title className="h6">{editing?.id ? `Edit ${editing.name}` : 'Add a room'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ErrorAlert error={createState.error || updateState.error} />
            <div className="row g-3">
              <div className="col-md-8">
                <Form.Group controlId="room-name">
                  <Form.Label className="small fw-semibold">Room name *</Form.Label>
                  <Form.Control required minLength={2} value={form.name} onChange={update('name')} />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group controlId="room-capacity">
                  <Form.Label className="small fw-semibold">Capacity *</Form.Label>
                  <Form.Control required type="number" min={1} value={form.capacity} onChange={update('capacity')} />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group controlId="room-floor">
                  <Form.Label className="small fw-semibold">Floor</Form.Label>
                  <Form.Control value={form.floor} onChange={update('floor')} placeholder="Floor 4" />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group controlId="room-location">
                  <Form.Label className="small fw-semibold">Location</Form.Label>
                  <Form.Control value={form.location} onChange={update('location')} placeholder="Main Building - Room A" />
                </Form.Group>
              </div>
              <div className="col-12">
                <Form.Group controlId="room-description">
                  <Form.Label className="small fw-semibold">Description</Form.Label>
                  <Form.Control as="textarea" rows={2} value={form.description} onChange={update('description')} />
                </Form.Group>
              </div>
              <div className="col-12">
                <Form.Group controlId="room-amenities">
                  <Form.Label className="small fw-semibold">Amenities</Form.Label>
                  <Form.Control value={form.amenities} onChange={update('amenities')} placeholder="Whiteboard, Projector, Video Conference" />
                  <Form.Text muted>Comma separated.</Form.Text>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group controlId="room-admin">
                  <Form.Label className="small fw-semibold">Room admin</Form.Label>
                  <Form.Select value={form.adminId} onChange={update('adminId')}>
                    <option value="">Unassigned</option>
                    {admins.map((user) => (
                      <option key={user.id} value={user.id}>{user.full_name} ({user.role === 'owner' ? 'owner' : 'room admin'})</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group controlId="room-price">
                  <Form.Label className="small fw-semibold">Internal hourly rate</Form.Label>
                  <Form.Control type="number" min={0} step="0.01" value={form.pricePerHour} onChange={update('pricePerHour')} />
                  <Form.Text muted>Recorded for cost reporting only; not charged to staff.</Form.Text>
                </Form.Group>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save room'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={Boolean(toDelete)} onHide={() => setToDelete(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6">Delete {toDelete?.name}?</Modal.Title>
        </Modal.Header>
        <Modal.Body className="small">
          Every reservation ever made for this room is deleted with it, including its history in the
          reports. If the room is only temporarily unavailable, take it out of service instead.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setToDelete(null)}>Keep it</Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deleteState.isLoading}>
            {deleteState.isLoading ? 'Deleting...' : 'Delete room'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
