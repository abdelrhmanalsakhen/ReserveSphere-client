import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Button from 'react-bootstrap/Button';
import { useRoomsQuery, useStatsQuery } from '../app/api';
import { selectIsAdmin } from '../features/authSlice';
import { ErrorAlert, Loading } from '../components/Feedback';
import { formatDate, formatSlot, formatTime } from '../lib/format';

function StatCard({ label, value, icon, hint }) {
  return (
    <div className="col-6 col-xl-3">
      <div className="rs-card p-3 h-100">
        <div className="d-flex justify-content-between align-items-start">
          <span className="rs-stat-label">{label}</span>
          <i className={`bi bi-${icon} text-teal`} />
        </div>
        <div className="rs-stat-value mt-2">{value}</div>
        {hint && <div className="small text-muted">{hint}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const isAdmin = useSelector(selectIsAdmin);
  const { data, isLoading, error } = useStatsQuery();

  // "Available now" needs a concrete window, so ask for the next hour. The window is
  // frozen on mount: a fresh timestamp each render would change the query key and
  // refetch forever.
  const [slot] = useState(() => {
    const now = new Date();
    return { from: now.toISOString(), to: new Date(now.getTime() + 3600_000).toISOString(), now };
  });
  const { data: roomsData, isLoading: loadingRooms } = useRoomsQuery({
    from: slot.from,
    to: slot.to,
    availableOnly: 'true',
  });

  if (isLoading) return <Loading label="Loading your dashboard" />;
  if (error) return <ErrorAlert error={error} />;

  const stats = data?.stats || {};
  const schedule = data?.todaySchedule || [];
  const availableRooms = (roomsData?.rooms || []).slice(0, 3);

  return (
    <>
      <div className="row g-3">
        <StatCard
          label="Available rooms now"
          value={`${stats.available_now} / ${stats.total_rooms}`}
          icon="door-open"
          hint={`${Math.round((stats.available_now / Math.max(stats.total_rooms, 1)) * 100)}% free`}
        />
        <StatCard label="My upcoming bookings" value={stats.my_upcoming} icon="calendar-check" hint="Approved and ahead" />
        <StatCard
          label={isAdmin ? 'Pending approvals' : 'My pending requests'}
          value={isAdmin ? stats.pending_all : stats.my_pending}
          icon="hourglass-split"
          hint={isAdmin ? 'Waiting on your decision' : 'Waiting on an admin'}
        />
        <StatCard label="Bookings today" value={stats.bookings_today} icon="calendar-week" hint="Across all rooms" />
      </div>

      <div className="row g-3 mt-1">
        <div className="col-lg-7">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h2 className="h6 fw-bold mb-0">Available in the next hour</h2>
            <Link to="/rooms" className="small">See all rooms</Link>
          </div>

          {loadingRooms && <div className="rs-card p-4 text-center text-muted small">Checking availability...</div>}
          {!loadingRooms && availableRooms.length === 0 && (
            <div className="rs-card p-4 text-center text-muted small">Every room is busy for the next hour.</div>
          )}

          {availableRooms.map((room) => (
            <div className="rs-card p-3 mb-2" key={room.id}>
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div>
                  <div className="fw-semibold">{room.name}</div>
                  <div className="small text-muted">
                    <i className="bi bi-people me-1" />Capacity {room.capacity}
                    <span className="mx-2">·</span>
                    <i className="bi bi-geo-alt me-1" />{room.floor} - {room.location}
                  </div>
                  <div className="d-flex flex-wrap gap-1 mt-2">
                    {room.amenities.slice(0, 3).map((amenity) => (
                      <span className="rs-amenity" key={amenity}>{amenity}</span>
                    ))}
                  </div>
                </div>
                <Button as={Link} to={`/reserve/${room.id}`} size="sm">Book now</Button>
              </div>
            </div>
          ))}
        </div>

        <div className="col-lg-5">
          <div className="rs-card p-3">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h2 className="h6 fw-bold mb-0">Today's schedule</h2>
                <div className="small text-muted">{formatDate(slot.now)}</div>
              </div>
              <Link to="/my-reservations" className="small">My reservations</Link>
            </div>

            {schedule.length === 0 && <p className="small text-muted mb-0">Nothing is booked today.</p>}

            {schedule.map((item) => (
              <div className="d-flex gap-3 mb-2" key={item.id}>
                <div className="small text-muted pt-2" style={{ width: 58 }}>{formatTime(item.starts_at)}</div>
                <div className="rs-schedule-item flex-grow-1 px-3 py-2">
                  <div className="small fw-semibold text-teal">{item.title}</div>
                  <div className="small text-muted">
                    {item.booked_by} · {item.room_name} · {formatSlot(item.starts_at, item.ends_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
