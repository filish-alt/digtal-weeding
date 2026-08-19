import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Event, StaffAccount } from '../types';
import { ShieldCheck, Plus, Key, Clock, X } from 'lucide-react';

interface StaffManagementPageProps {
  event: Event | null;
}

export const StaffManagementPage: React.FC<StaffManagementPageProps> = ({ event }) => {
  const { fetchWithAuth } = useAuth();
  const [staffList, setStaffList] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [stationId, setStationId] = useState('');
  const [pinCode, setPinCode] = useState('');

  useEffect(() => {
    if (event) {
      loadStaff();
    }
  }, [event]);

  const loadStaff = async () => {
    if (!event) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/events/${event.id}/staff`);
      if (res.ok) {
        const data: StaffAccount[] = await res.json();
        setStaffList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    try {
      const res = await fetchWithAuth(`/api/events/${event.id}/staff`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          stationId: stationId || undefined,
          pinCode,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        loadStaff();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create staff account');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setName('');
    setStationId('');
    setPinCode('');
  };

  if (!event) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        Please select or create an event in Overview first.
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Door Staff Accounts</h1>
          <p className="page-subtitle">
            Generate short-lived PIN codes and station IDs for event check-in operators
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus size={16} /> Add Staff Operator
        </button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Operator Name</th>
                <th>Station ID</th>
                <th>Created At</th>
                <th>Token Status</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff) => (
                <tr key={staff.id}>
                  <td style={{ fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
                      {staff.name}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-neutral">
                      {staff.stationId || 'default-station'}
                    </span>
                  </td>
                  <td>{new Date(staff.createdAt).toLocaleString()}</td>
                  <td>
                    <span className="badge badge-success">Active Token</span>
                  </td>
                </tr>
              ))}
              {staffList.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No staff accounts created for this event yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Create Check-in Staff Account</h3>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div className="form-group">
                <label className="form-label">Operator Name</label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="Gate 1 Operator / Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Station Identifier</label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="gate-1 / tablet-north"
                  value={stationId}
                  onChange={(e) => setStationId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Security PIN Code (Numeric)</label>
                <input
                  type="password"
                  className="input-text"
                  placeholder="e.g. 1234 or 9876"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Generate Staff PIN
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
