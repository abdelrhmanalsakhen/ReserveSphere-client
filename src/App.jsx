import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Reserve from './pages/Reserve';
import MyReservations from './pages/MyReservations';
import Approvals from './pages/Approvals';
import Reports from './pages/Reports';
import ManageRooms from './pages/ManageRooms';
import ManageUsers from './pages/ManageUsers';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="reserve" element={<Reserve />} />
          <Route path="reserve/:roomId" element={<Reserve />} />
          <Route path="my-reservations" element={<MyReservations />} />

          <Route element={<RequireAuth roles={['room_admin', 'owner']} />}>
            <Route path="approvals" element={<Approvals />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          <Route element={<RequireAuth roles={['owner']} />}>
            <Route path="manage/rooms" element={<ManageRooms />} />
            <Route path="manage/users" element={<ManageUsers />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
