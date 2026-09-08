import { useSelector } from 'react-redux';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import { useUpdateUserRoleMutation, useUsersQuery } from '../app/api';
import { ErrorAlert, Loading } from '../components/Feedback';
import { ROLE_LABELS } from '../lib/format';
import { selectUser } from '../features/authSlice';

export default function ManageUsers() {
  const currentUser = useSelector(selectUser);
  const { data, isLoading, error } = useUsersQuery();
  const [updateRole, { isLoading: saving, error: saveError }] = useUpdateUserRoleMutation();

  if (isLoading) return <Loading label="Loading users" />;

  return (
    <>
      <p className="small text-muted">
        Promote staff to room admin so they can approve requests for the rooms assigned to them.
      </p>

      <ErrorAlert error={error || saveError} />

      <div className="rs-card p-0 overflow-hidden">
        <Table responsive hover className="mb-0 align-middle">
          <thead className="table-light">
            <tr className="rs-stat-label">
              <th className="ps-3">Name</th>
              <th>E-mail</th>
              <th>Department</th>
              <th className="text-end">Rooms managed</th>
              <th style={{ width: 190 }} className="pe-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {(data?.users || []).map((user) => (
              <tr key={user.id}>
                <td className="ps-3 fw-semibold small">
                  {user.full_name}
                  {user.id === currentUser.id && <Badge bg="light" text="dark" className="ms-2">You</Badge>}
                </td>
                <td className="small text-muted">{user.email}</td>
                <td className="small text-muted">{user.department || '-'}</td>
                <td className="text-end small">{user.managed_rooms}</td>
                <td className="pe-3">
                  {user.id === currentUser.id ? (
                    <span className="small text-muted">{ROLE_LABELS[user.role]}</span>
                  ) : (
                    <Form.Select
                      size="sm"
                      value={user.role}
                      disabled={saving}
                      onChange={(e) => updateRole({ id: user.id, role: e.target.value })}
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </Form.Select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  );
}
