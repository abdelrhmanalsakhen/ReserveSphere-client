import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import {
  useCreateReservationMutation,
  useReservationQuery,
  useRoomQuery,
  useRoomsQuery,
  useUpdateReservationMutation,
} from '../app/api';
import { ErrorAlert, Loading } from '../components/Feedback';
import { dateInput, formatSlot, formatDate, timeInput, todayInput, toIso } from '../lib/format';

/** Room picker shown when the page is opened without a room. */
function ChooseRoom() {
  const { data, isLoading } = useRoomsQuery({});
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  if (isLoading) return <Loading label="Loading rooms" />;

  return (
    <div className="rs-card p-4" style={{ maxWidth: 520 }}>
      <h2 className="h6 fw-bold">Which room do you need?</h2>
      <p className="small text-muted">Or browse the full list with availability and filters.</p>
      <Form.Select className="mb-3" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
        <option value="">Select a room...</option>
        {(data?.rooms || []).map((room) => (
          <option key={room.id} value={room.id}>{room.name} - {room.floor} ({room.capacity} seats)</option>
        ))}
      </Form.Select>
      <div className="d-flex gap-2">
        <Button disabled={!roomId} onClick={() => navigate(`/reserve/${roomId}`)}>Continue</Button>
        <Button as={Link} to="/rooms" variant="outline-secondary">Browse rooms</Button>
      </div>
    </div>
  );
}

function AttendeeInput({ attendees, onChange }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const email = draft.trim().toLowerCase();
    if (email && !attendees.includes(email)) onChange([...attendees, email]);
    setDraft('');
  };

  return (
    <>
      <div className="d-flex flex-wrap gap-1 mb-2">
        {attendees.map((email) => (
          <span className="rs-amenity d-inline-flex align-items-center gap-1" key={email}>
            {email}
            <button
              type="button"
              className="btn-close"
              style={{ fontSize: '.5rem' }}
              aria-label={`Remove ${email}`}
              onClick={() => onChange(attendees.filter((a) => a !== email))}
            />
          </span>
        ))}
      </div>
      <div className="input-group input-group-sm">
        <Form.Control
          type="email"
          placeholder="colleague@reservesphere.local"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button variant="outline-secondary" onClick={add}>Add</Button>
      </div>
    </>
  );
}

export default function Reserve() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  const { data: roomData, isLoading: loadingRoom } = useRoomQuery(roomId, { skip: !roomId });
  const { data: editData } = useReservationQuery(editId, { skip: !editId });
  const [createReservation, createState] = useCreateReservationMutation();
  const [updateReservation, updateState] = useUpdateReservationMutation();

  const [form, setForm] = useState({
    title: '',
    purpose: '',
    attendeeCount: '',
    date: searchParams.get('date') || todayInput(),
    startTime: searchParams.get('start') || '09:00',
    endTime: searchParams.get('end') || '10:00',
    priority: 'normal',
    attendees: [],
  });

  // Pre-fill when modifying an existing request.
  useEffect(() => {
    const reservation = editData?.reservation;
    if (!reservation) return;
    setForm({
      title: reservation.title,
      purpose: reservation.purpose || '',
      attendeeCount: reservation.attendee_count || '',
      date: dateInput(reservation.starts_at),
      startTime: timeInput(reservation.starts_at),
      endTime: timeInput(reservation.ends_at),
      priority: reservation.priority,
      attendees: reservation.attendees || [],
    });
  }, [editData]);

  if (!roomId) return <ChooseRoom />;
  if (loadingRoom) return <Loading label="Loading room" />;

  const room = roomData?.room;
  const schedule = roomData?.schedule || [];
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  const pending = createState.isLoading || updateState.isLoading;

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      roomId: Number(roomId),
      title: form.title,
      purpose: form.purpose || undefined,
      attendeeCount: form.attendeeCount ? Number(form.attendeeCount) : undefined,
      startsAt: toIso(form.date, form.startTime),
      endsAt: toIso(form.date, form.endTime),
      priority: form.priority,
      attendees: form.attendees,
    };
    try {
      if (editId) await updateReservation({ id: editId, ...payload }).unwrap();
      else await createReservation(payload).unwrap();
      navigate('/my-reservations');
    } catch {
      /* surfaced by ErrorAlert */
    }
  };

  return (
    <div className="row g-3">
      <div className="col-lg-4">
        <div className="rs-card overflow-hidden">
          <div className="rs-room-thumb rounded-0"><i className="bi bi-easel2" /></div>
          <div className="p-3">
            <h2 className="h6 fw-bold mb-1">{room.name}</h2>
            <div className="small text-muted">{room.floor} · {room.location}</div>
            <div className="small text-muted mb-3"><i className="bi bi-people me-1" />Seats {room.capacity}</div>

            {room.description && <p className="small text-muted">{room.description}</p>}

            <div className="rs-stat-label mb-2">Amenities</div>
            <div className="d-flex flex-wrap gap-1 mb-3">
              {room.amenities.length
                ? room.amenities.map((amenity) => <span className="rs-amenity" key={amenity}>{amenity}</span>)
                : <span className="small text-muted">None listed.</span>}
            </div>

            <div className="rs-stat-label mb-2">Room admin</div>
            <div className="small">{room.admin_name || 'Not assigned'}</div>
          </div>
        </div>

        <div className="rs-card p-3 mt-3">
          <div className="rs-stat-label mb-2">Next confirmed bookings</div>
          {schedule.length === 0 && <p className="small text-muted mb-0">Nothing booked yet.</p>}
          {schedule.slice(0, 6).map((item) => (
            <div className="small d-flex justify-content-between border-bottom py-1" key={item.id}>
              <span className="text-truncate me-2">{formatDate(item.starts_at)}</span>
              <span className="text-muted flex-shrink-0">{formatSlot(item.starts_at, item.ends_at)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="col-lg-8">
        <Form onSubmit={submit} className="rs-card p-4">
          <h2 className="h6 fw-bold mb-1">{editId ? 'Modify reservation' : 'Reservation details'}</h2>
          <p className="small text-muted mb-4">
            {editId
              ? 'A modified request goes back to the room admin for approval.'
              : 'Your request is sent to the room admin for approval.'}
          </p>

          <ErrorAlert error={createState.error || updateState.error} />

          <Form.Group className="mb-3" controlId="title">
            <Form.Label className="small fw-semibold">Meeting title *</Form.Label>
            <Form.Control required minLength={3} value={form.title} onChange={update('title')} placeholder="Q1 Strategy Review" />
          </Form.Group>

          <div className="row g-3 mb-3">
            <Form.Group className="col-md-4" controlId="date">
              <Form.Label className="small fw-semibold">Date *</Form.Label>
              <Form.Control required type="date" min={todayInput()} value={form.date} onChange={update('date')} />
            </Form.Group>
            <Form.Group className="col-6 col-md-4" controlId="startTime">
              <Form.Label className="small fw-semibold">Start time *</Form.Label>
              <Form.Control required type="time" value={form.startTime} onChange={update('startTime')} />
            </Form.Group>
            <Form.Group className="col-6 col-md-4" controlId="endTime">
              <Form.Label className="small fw-semibold">End time *</Form.Label>
              <Form.Control required type="time" value={form.endTime} onChange={update('endTime')} />
            </Form.Group>
          </div>

          <div className="row g-3 mb-3">
            <Form.Group className="col-md-4" controlId="attendeeCount">
              <Form.Label className="small fw-semibold">Expected attendees</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={room.capacity}
                value={form.attendeeCount}
                onChange={update('attendeeCount')}
                placeholder={`Max ${room.capacity}`}
              />
            </Form.Group>
            <div className="col-md-8">
              <span className="form-label small fw-semibold d-block" id="priority-label">Booking priority</span>
              <ToggleButtonGroup
                aria-labelledby="priority-label"
                type="radio"
                name="priority"
                value={form.priority}
                onChange={(value) => setForm({ ...form, priority: value })}
              >
                <ToggleButton id="priority-normal" value="normal" variant="outline-primary">Normal</ToggleButton>
                <ToggleButton id="priority-high" value="high" variant="outline-primary">High priority</ToggleButton>
              </ToggleButtonGroup>
              <Form.Text muted className="d-block">
                High priority lets an admin clear a conflicting booking if the meeting is urgent.
              </Form.Text>
            </div>
          </div>

          <Form.Group className="mb-3" controlId="attendees">
            <Form.Label className="small fw-semibold">Invite attendees</Form.Label>
            <AttendeeInput attendees={form.attendees} onChange={(attendees) => setForm({ ...form, attendees })} />
          </Form.Group>

          <Form.Group className="mb-4" controlId="purpose">
            <Form.Label className="small fw-semibold">Meeting purpose</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={form.purpose}
              onChange={update('purpose')}
              placeholder="Describe the purpose so the room admin can review the request."
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="outline-secondary" onClick={() => navigate(-1)} disabled={pending}>Discard</Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Submitting...' : editId ? 'Save changes' : 'Submit booking request'}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
