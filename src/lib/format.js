const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

export const formatDate = (value) => (value ? dateFmt.format(new Date(value)) : '-');
export const formatTime = (value) => (value ? timeFmt.format(new Date(value)) : '-');
export const formatSlot = (from, to) => `${formatTime(from)} - ${formatTime(to)}`;
export const formatDateTime = (value) => (value ? `${formatDate(value)}, ${formatTime(value)}` : '-');

export const durationHours = (from, to) => Math.round(((new Date(to) - new Date(from)) / 3600000) * 10) / 10;

export const STATUS_META = {
  pending: { label: 'Pending approval', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
  overridden: { label: 'Overridden', variant: 'dark' },
};

export const ROLE_LABELS = {
  employee: 'Employee',
  room_admin: 'Room admin',
  owner: 'System owner',
};

/** Turns any RTK Query error into a single sentence fit for an alert. */
export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return null;
  const data = error.data;
  if (data?.details?.length) return data.details.map((d) => d.message).join('. ');
  return data?.error || error.error || fallback;
}

/** `date` (yyyy-mm-dd) plus `time` (hh:mm) from native inputs -> ISO instant. */
export const toIso = (date, time) => (date && time ? new Date(`${date}T${time}`).toISOString() : null);

export const todayInput = () => new Date().toLocaleDateString('en-CA');
export const dateInput = (value) => new Date(value).toLocaleDateString('en-CA');
export const timeInput = (value) =>
  new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
