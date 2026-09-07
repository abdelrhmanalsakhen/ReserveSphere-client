import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import NotificationBell from './NotificationBell';
import { useQuoteQuery } from '../app/api';
import { loggedOut, selectIsAdmin, selectIsOwner, selectUser } from '../features/authSlice';
import { ROLE_LABELS } from '../lib/format';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'grid-1x2', title: 'Welcome back' },
  { to: '/rooms', label: 'Rooms', icon: 'building', title: 'Browse & book spaces' },
  { to: '/reserve', label: 'New reservation', icon: 'calendar-plus', title: 'New reservation' },
  { to: '/my-reservations', label: 'My reservations', icon: 'journal-check', title: 'Active reservation ledger' },
  { to: '/approvals', label: 'Approvals', icon: 'clipboard-check', title: 'Approval queue', admin: true },
  { to: '/reports', label: 'Reports', icon: 'bar-chart', title: 'Utilisation reports', admin: true },
  { to: '/manage/rooms', label: 'Manage rooms', icon: 'sliders', title: 'Room management', owner: true },
  { to: '/manage/users', label: 'Manage users', icon: 'people', title: 'User management', owner: true },
];

/** Quote of the day - dashboard only, and silently absent while loading or if the
 *  upstream service is down: it is decoration, not information the user came for. */
function QuoteOfTheDay() {
  const { data } = useQuoteQuery();
  if (!data) return null;

  return (
    <figure className="rs-quote d-none d-xl-block flex-shrink-1 min-w-0 mb-0" style={{ maxWidth: 420 }}>
      <blockquote className="small fst-italic text-truncate mb-0" title={`${data.text} - ${data.author}`}>
        <i className="bi bi-quote me-1 text-teal" />{data.text}
      </blockquote>
      <figcaption className="text-muted text-truncate" style={{ fontSize: '.7rem' }}>&mdash; {data.author}</figcaption>
    </figure>
  );
}

const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('');

function SidebarContent({ items, user, onNavigate, onSignOut }) {
  return (
    <div className="d-flex flex-column h-100 p-3">
      <Link to="/" className="text-decoration-none mb-3 d-flex align-items-center gap-2" onClick={onNavigate}>
        <span className="rs-avatar"><i className="bi bi-calendar2-week" /></span>
        <span className="rs-brand lh-1">
          ReserveSphere
          <small className="d-block">MINISTRY OF TRANSPORT</small>
        </span>
      </Link>

      <div className="rs-role-chip d-flex align-items-center justify-content-between px-3 py-2 mb-3">
        <div>
          <div className="fw-semibold">{ROLE_LABELS[user?.role]}</div>
          <div className="opacity-75" style={{ fontSize: '.7rem' }}>{user?.department || 'Ministry of Transport'}</div>
        </div>
        <i className="bi bi-shield-check text-teal" />
      </div>

      <nav className="rs-nav d-flex flex-column gap-1 flex-grow-1">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className="nav-link" onClick={onNavigate}>
            <i className={`bi bi-${item.icon}`} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="rs-sidebar-footer pt-3 mt-3 d-flex align-items-center gap-2">
        <span className="rs-avatar">{initials(user?.full_name)}</span>
        <div className="flex-grow-1 min-w-0">
          <div className="text-white small fw-semibold text-truncate">{user?.full_name}</div>
          <div className="text-truncate opacity-75" style={{ fontSize: '.7rem' }}>{user?.email}</div>
        </div>
        <Button variant="link" className="text-decoration-none p-0 text-white-50" title="Sign out" onClick={onSignOut}>
          <i className="bi bi-box-arrow-right" />
        </Button>
      </div>
    </div>
  );
}

export default function Layout() {
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);
  const isOwner = useSelector(selectIsOwner);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  const items = NAV_ITEMS.filter((item) => (item.owner ? isOwner : item.admin ? isAdmin : true));
  const current = [...items].reverse().find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
  const heading = current?.to === '/' ? `Welcome back, ${user?.full_name?.split(' ')[0]}` : current?.title || 'ReserveSphere';

  const signOut = () => {
    dispatch(loggedOut());
    navigate('/login');
  };

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/rooms?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="rs-shell d-flex">
      <aside className="rs-sidebar d-none d-lg-block">
        <SidebarContent items={items} user={user} onSignOut={signOut} />
      </aside>

      <Offcanvas show={menuOpen} onHide={() => setMenuOpen(false)} className="rs-sidebar" style={{ width: 250 }}>
        <SidebarContent items={items} user={user} onNavigate={() => setMenuOpen(false)} onSignOut={signOut} />
      </Offcanvas>

      <div className="flex-grow-1 min-w-0 d-flex flex-column">
        <header className="rs-topbar d-flex align-items-center gap-3 px-3 px-lg-4 py-3">
          <Button variant="light" className="d-lg-none border" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <i className="bi bi-list" />
          </Button>
          <div className="flex-grow-1 min-w-0">
            <div className="rs-breadcrumb">ReserveSphere {current?.label ? `› ${current.label}` : ''}</div>
            <h1 className="h5 mb-0 fw-bold text-truncate">{heading}</h1>
          </div>
          {pathname === '/' && <QuoteOfTheDay />}
          <Form onSubmit={submitSearch} className="d-none d-md-block" style={{ width: 260 }}>
            <InputGroup size="sm">
              <InputGroup.Text className="bg-white"><i className="bi bi-search" /></InputGroup.Text>
              <Form.Control
                placeholder="Search rooms, floors, locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          </Form>
          <NotificationBell />
        </header>

        <main className="rs-main flex-grow-1 p-3 p-lg-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
