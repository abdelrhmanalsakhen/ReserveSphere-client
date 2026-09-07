import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Badge from 'react-bootstrap/Badge';
import { useRoomFiltersQuery, useRoomsQuery } from '../app/api';
import { EmptyState, ErrorAlert, Loading } from '../components/Feedback';
import { todayInput, toIso } from '../lib/format';

const CAPACITY_PRESETS = [
  { value: '', label: 'Any capacity' },
  { value: '2', label: '2+ people' },
  { value: '6', label: '6+ people' },
  { value: '12', label: '12+ people' },
  { value: '20', label: '20+ people' },
];

/** Rounds up to the next half hour, so the default window is bookable. */
function nextHalfHour(offsetMinutes = 0) {
  const date = new Date(Date.now() + offsetMinutes * 60_000);
  date.setMinutes(date.getMinutes() > 30 ? 60 : 30, 0, 0);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function Rooms() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    floor: '',
    minCapacity: '',
    date: todayInput(),
    startTime: nextHalfHour(),
    endTime: nextHalfHour(60),
    availableOnly: true,
    amenities: [],
  });

  // The top bar's search box navigates here with a query string.
  useEffect(() => {
    const search = searchParams.get('search');
    if (search !== null) setFilters((current) => ({ ...current, search }));
  }, [searchParams]);

  const { data: filterOptions } = useRoomFiltersQuery();

  const queryArgs = useMemo(() => {
    const from = toIso(filters.date, filters.startTime);
    const to = toIso(filters.date, filters.endTime);
    const usableWindow = from && to && new Date(to) > new Date(from);
    return {
      ...(usableWindow ? { from, to } : {}),
      ...(usableWindow && filters.availableOnly ? { availableOnly: 'true' } : {}),
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.floor ? { floor: filters.floor } : {}),
      ...(filters.minCapacity ? { minCapacity: filters.minCapacity } : {}),
      ...(filters.amenities.length ? { amenities: filters.amenities.join(',') } : {}),
    };
  }, [filters]);

  const { data, isLoading, isFetching, error } = useRoomsQuery(queryArgs);

  const update = (field) => (event) =>
    setFilters({ ...filters, [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value });

  const toggleAmenity = (amenity) =>
    setFilters((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((a) => a !== amenity)
        : [...current.amenities, amenity],
    }));

  const badWindow = new Date(toIso(filters.date, filters.endTime)) <= new Date(toIso(filters.date, filters.startTime));

  return (
    <>
      <div className="rs-card p-3 mb-3">
        <div className="row g-2 align-items-end">
          <Form.Group className="col-12 col-md-4 col-xl-3" controlId="filter-search">
            <Form.Label className="rs-stat-label">Room name or location</Form.Label>
            <Form.Control size="sm" placeholder="Filter by name..." value={filters.search} onChange={update('search')} />
          </Form.Group>
          <Form.Group className="col-6 col-md-4 col-xl-2" controlId="filter-floor">
            <Form.Label className="rs-stat-label">Floor</Form.Label>
            <Form.Select size="sm" value={filters.floor} onChange={update('floor')}>
              <option value="">All floors</option>
              {(filterOptions?.floors || []).map((floor) => <option key={floor}>{floor}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group className="col-6 col-md-4 col-xl-2" controlId="filter-capacity">
            <Form.Label className="rs-stat-label">Capacity</Form.Label>
            <Form.Select size="sm" value={filters.minCapacity} onChange={update('minCapacity')}>
              {CAPACITY_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>{preset.label}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <div className="col-12 col-xl-5">
            <span className="form-label rs-stat-label" id="window-label">Time window</span>
            <div className="d-flex flex-wrap gap-2">
              <Form.Control
                size="sm"
                type="date"
                aria-label="Date"
                min={todayInput()}
                value={filters.date}
                onChange={update('date')}
                style={{ flex: '1 1 140px' }}
              />
              <Form.Control
                size="sm"
                type="time"
                aria-label="Available from"
                value={filters.startTime}
                onChange={update('startTime')}
                style={{ flex: '1 1 110px' }}
              />
              <Form.Control
                size="sm"
                type="time"
                aria-label="Available until"
                value={filters.endTime}
                onChange={update('endTime')}
                style={{ flex: '1 1 110px' }}
              />
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-3 mt-3 pt-3 border-top">
          <Form.Check
            type="switch"
            id="availableOnly"
            label="Free in this window only"
            className="small fw-semibold"
            checked={filters.availableOnly}
            onChange={update('availableOnly')}
          />
          {(filterOptions?.amenities || []).length > 0 && (
            <>
              <span className="rs-stat-label ms-lg-3">Amenities</span>
              {filterOptions.amenities.map((amenity) => (
                <Form.Check
                  key={amenity}
                  type="checkbox"
                  id={`amenity-${amenity}`}
                  label={amenity}
                  className="small"
                  checked={filters.amenities.includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {badWindow && <div className="alert alert-warning py-2 small">The end time must be after the start time.</div>}
      <ErrorAlert error={error} />

      <div className="d-flex align-items-center justify-content-between mb-2">
        <h2 className="h6 fw-bold mb-0">
          {data ? `${data.count} meeting space${data.count === 1 ? '' : 's'} found` : 'Searching...'}
        </h2>
        {isFetching && <span className="small text-muted">Updating...</span>}
      </div>

      {isLoading && <Loading label="Loading rooms" />}

      {data?.count === 0 && (
        <EmptyState
          icon="search"
          title="No rooms match those filters"
          hint="Try a wider time window, a lower capacity, or fewer amenities."
        />
      )}

      <div className="row g-3">
        {(data?.rooms || []).map((room) => (
          <div className="col-md-6 col-xl-4" key={room.id}>
            <div className="rs-card h-100 d-flex flex-column">
              <div className="rs-room-thumb"><i className="bi bi-easel2" /></div>
              <div className="p-3 d-flex flex-column flex-grow-1">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <span className="fw-semibold">{room.name}</span>
                  {room.available === null ? null : (
                    <Badge bg={room.available ? 'success' : 'danger'}>{room.available ? 'Available' : 'Booked'}</Badge>
                  )}
                </div>
                <div className="small text-muted mt-1">
                  <i className="bi bi-people me-1" />Up to {room.capacity} people
                  <span className="mx-2">·</span>
                  <i className="bi bi-geo-alt me-1" />{room.floor}
                </div>
                <div className="small text-muted">{room.location}</div>
                <div className="d-flex flex-wrap gap-1 mt-2">
                  {room.amenities.map((amenity) => <span className="rs-amenity" key={amenity}>{amenity}</span>)}
                </div>
                <div className="d-flex justify-content-between align-items-end mt-auto pt-3">
                  <span className="small text-muted">
                    {room.admin_name ? <><i className="bi bi-person-badge me-1" />{room.admin_name}</> : 'No room admin'}
                  </span>
                  <Button
                    as={Link}
                    to={`/reserve/${room.id}?date=${filters.date}&start=${filters.startTime}&end=${filters.endTime}`}
                    size="sm"
                    disabled={room.available === false}
                  >
                    Reserve room
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
