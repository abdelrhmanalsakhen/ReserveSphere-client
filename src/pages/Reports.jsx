import { useState } from 'react';
import { useSelector } from 'react-redux';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import { useReportsQuery } from '../app/api';
import { ErrorAlert, Loading } from '../components/Feedback';
import { STATUS_META } from '../lib/format';
import { selectIsOwner } from '../features/authSlice';

const RANGES = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 365, label: 'Last 12 months' },
];

export default function Reports() {
  const [days, setDays] = useState(30);
  const isOwner = useSelector(selectIsOwner);
  const { data, isLoading, error } = useReportsQuery(days);

  if (isLoading) return <Loading label="Building reports" />;
  if (error) return <ErrorAlert error={error} />;

  const byRoom = data?.byRoom || [];
  const byStatus = data?.byStatus || [];
  const byHour = data?.byHour || [];

  const maxHours = Math.max(...byRoom.map((r) => Number(r.booked_hours)), 1);
  const maxHourCount = Math.max(...byHour.map((h) => Number(h.count)), 1);
  const totalRequests = byStatus.reduce((sum, row) => sum + Number(row.count), 0);
  const totalHours = byRoom.reduce((sum, row) => sum + Number(row.booked_hours), 0);
  const unused = byRoom.filter((room) => Number(room.approved_bookings) === 0);

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <p className="small text-muted mb-0">
          Utilisation across {isOwner ? 'every room in the Ministry' : 'the rooms you administer'}, to support
          decisions about space allocation.
        </p>
        <Form.Select
          size="sm"
          style={{ width: 180 }}
          aria-label="Reporting period"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          {RANGES.map((range) => <option key={range.value} value={range.value}>{range.label}</option>)}
        </Form.Select>
      </div>

      <div className="row g-3 mb-1">
        <div className="col-6 col-lg-3">
          <div className="rs-card p-3 h-100">
            <div className="rs-stat-label">Total requests</div>
            <div className="rs-stat-value">{totalRequests}</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="rs-card p-3 h-100">
            <div className="rs-stat-label">Hours booked</div>
            <div className="rs-stat-value">{Math.round(totalHours)}</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="rs-card p-3 h-100">
            <div className="rs-stat-label">Most used room</div>
            <div className="fw-semibold mt-2">{byRoom[0]?.name || '-'}</div>
            <div className="small text-muted">{byRoom[0]?.booked_hours || 0} hours</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="rs-card p-3 h-100">
            <div className="rs-stat-label">Never booked</div>
            <div className="rs-stat-value">{unused.length}</div>
            <div className="small text-muted">rooms with no approved booking</div>
          </div>
        </div>
      </div>

      <div className="row g-3 mt-1">
        <div className="col-lg-7">
          <div className="rs-card p-3">
            <h2 className="h6 fw-bold mb-3">Utilisation by room</h2>
            <Table responsive className="mb-0 align-middle small">
              <thead>
                <tr className="rs-stat-label">
                  <th>Room</th>
                  <th className="text-end">Requests</th>
                  <th className="text-end">Approved</th>
                  <th className="text-end">Hours</th>
                  <th style={{ width: 120 }}>Share</th>
                  <th className="text-end">Avg. attendees</th>
                </tr>
              </thead>
              <tbody>
                {byRoom.map((room) => (
                  <tr key={room.id}>
                    <td className="fw-semibold">{room.name}</td>
                    <td className="text-end">{room.total_requests}</td>
                    <td className="text-end">{room.approved_bookings}</td>
                    <td className="text-end">{room.booked_hours}</td>
                    <td>
                      <div className="rs-bar" style={{ width: `${(Number(room.booked_hours) / maxHours) * 100}%` }} />
                    </td>
                    <td className="text-end">{Number(room.avg_attendees) || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="rs-card p-3 mb-3">
            <h2 className="h6 fw-bold mb-3">Requests by outcome</h2>
            {byStatus.length === 0 && <p className="small text-muted mb-0">No requests in this period.</p>}
            {byStatus.map((row) => (
              <div className="d-flex align-items-center gap-2 mb-2" key={row.status}>
                <span className="small flex-shrink-0" style={{ width: 130 }}>
                  {STATUS_META[row.status]?.label || row.status}
                </span>
                <div className="flex-grow-1">
                  <div className="rs-bar" style={{ width: `${(Number(row.count) / totalRequests) * 100}%` }} />
                </div>
                <span className="small text-muted">{row.count}</span>
              </div>
            ))}
          </div>

          <div className="rs-card p-3">
            <h2 className="h6 fw-bold mb-3">Busiest hours</h2>
            {byHour.length === 0 && <p className="small text-muted mb-0">No approved bookings in this period.</p>}
            <div className="d-flex align-items-end gap-1" style={{ height: 120 }}>
              {byHour.map((row) => (
                <div className="text-center flex-grow-1" key={row.hour}>
                  <div
                    className="rs-bar mx-auto"
                    style={{ height: `${(Number(row.count) / maxHourCount) * 90}px`, width: '70%' }}
                    title={`${row.count} bookings`}
                  />
                  <div className="text-muted" style={{ fontSize: '.6rem' }}>{row.hour}h</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
