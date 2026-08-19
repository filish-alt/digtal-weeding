import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Event, Guest, Invitation } from '../types';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  X,
} from 'lucide-react';

interface GuestListPageProps {
  event: Event | null;
}

export const GuestListPage: React.FC<GuestListPageProps> = ({ event }) => {
  const { fetchWithAuth } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAttendance, setFilterAttendance] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);

  // Form states
  const [selectedInvitationId, setSelectedInvitationId] = useState('');
  const [fullName, setFullName] = useState('');
  const [relationshipGroup, setRelationshipGroup] = useState('');
  const [needsPhysicalCard, setNeedsPhysicalCard] = useState(false);
  const [tableNumber, setTableNumber] = useState<number | ''>('');

  // CSV paste state
  const [csvText, setCsvText] = useState('');

  useEffect(() => {
    if (event) {
      loadData();
    }
  }, [event]);

  const loadData = async () => {
    if (!event) return;
    setLoading(true);
    try {
      const [guestsRes, invRes] = await Promise.all([
        fetchWithAuth(`/api/events/${event.id}/guests`),
        fetchWithAuth(`/api/events/${event.id}/invitations`),
      ]);

      if (guestsRes.ok) {
        const guestData: Guest[] = await guestsRes.json();
        setGuests(guestData);
      }

      if (invRes.ok) {
        const invData: Invitation[] = await invRes.json();
        setInvitations(invData);
        if (invData.length > 0) {
          setSelectedInvitationId(invData[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !selectedInvitationId) return;

    try {
      const res = await fetchWithAuth(
        `/api/events/${event.id}/invitations/${selectedInvitationId}/guests`,
        {
          method: 'POST',
          body: JSON.stringify({
            fullName,
            relationshipGroup: relationshipGroup || undefined,
            needsPhysicalCard,
            tableNumber: tableNumber ? Number(tableNumber) : undefined,
          }),
        },
      );

      if (res.ok) {
        setShowAddModal(false);
        resetForm();
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to add guest');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !editGuest) return;

    try {
      const res = await fetchWithAuth(
        `/api/events/${event.id}/invitations/${editGuest.invitationId}/guests/${editGuest.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            fullName,
            relationshipGroup: relationshipGroup || undefined,
            needsPhysicalCard,
            tableNumber: tableNumber ? Number(tableNumber) : undefined,
          }),
        },
      );

      if (res.ok) {
        setEditGuest(null);
        resetForm();
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGuest = async (guest: Guest) => {
    if (
      !event ||
      !confirm(`Are you sure you want to delete ${guest.fullName}?`)
    )
      return;

    try {
      const res = await fetchWithAuth(
        `/api/events/${event.id}/invitations/${guest.invitationId}/guests/${guest.id}`,
        { method: 'DELETE' },
      );

      if (res.ok) {
        setGuests((prev) => prev.filter((g) => g.id !== guest.id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !selectedInvitationId || !csvText.trim()) return;

    const lines = csvText.trim().split('\n');
    let importedCount = 0;

    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length === 0 || !parts[0]) continue;

      const [guestName, group, table] = parts;

      try {
        await fetchWithAuth(
          `/api/events/${event.id}/invitations/${selectedInvitationId}/guests`,
          {
            method: 'POST',
            body: JSON.stringify({
              fullName: guestName,
              relationshipGroup: group || undefined,
              tableNumber: table ? Number(table) : undefined,
            }),
          },
        );
        importedCount++;
      } catch (err) {
        console.error(err);
      }
    }

    alert(`Successfully imported ${importedCount} guests!`);
    setShowCsvModal(false);
    setCsvText('');
    loadData();
  };

  const resetForm = () => {
    setFullName('');
    setRelationshipGroup('');
    setNeedsPhysicalCard(false);
    setTableNumber('');
  };

  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.relationshipGroup &&
        g.relationshipGroup.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterAttendance === 'attending') {
      return matchesSearch && g.isAttending === true;
    }
    if (filterAttendance === 'declined') {
      return matchesSearch && g.isAttending === false;
    }
    if (filterAttendance === 'pending') {
      return matchesSearch && (g.isAttending === null || g.isAttending === undefined);
    }

    return matchesSearch;
  });

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
          <h1 className="page-title">Guest List</h1>
          <p className="page-subtitle">
            Manage all guests across invitations for {event.coupleNames}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-outline"
            onClick={() => setShowCsvModal(true)}
          >
            <FileSpreadsheet size={16} /> Import CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <Plus size={16} /> Add Guest
          </button>
        </div>
      </div>

      <div className="card">
        {/* Filters Bar */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="input-text"
              style={{ paddingLeft: '40px' }}
              placeholder="Search guest name or group..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="input-text"
            style={{ width: '180px' }}
            value={filterAttendance}
            onChange={(e) => setFilterAttendance(e.target.value)}
          >
            <option value="all">All RSVP Statuses</option>
            <option value="attending">Attending Only</option>
            <option value="declined">Declined Only</option>
            <option value="pending">Pending Response</option>
          </select>
        </div>

        {/* Guest Data Table */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Guest Name</th>
                <th>Group</th>
                <th>RSVP Status</th>
                <th>Check-in Status</th>
                <th>Table</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest) => {
                let rsvpBadge = <span className="badge badge-neutral"><Clock size={12} /> Pending</span>;
                if (guest.isAttending === true) {
                  rsvpBadge = <span className="badge badge-success"><CheckCircle size={12} /> Attending</span>;
                } else if (guest.isAttending === false) {
                  rsvpBadge = <span className="badge badge-danger"><XCircle size={12} /> Declined</span>;
                }

                const checkinBadge = guest.checkin ? (
                  <span className="badge badge-success">
                    Checked In ({new Date(guest.checkin.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
                ) : (
                  <span className="badge badge-neutral">Not Checked In</span>
                );

                return (
                  <tr key={guest.id}>
                    <td style={{ fontWeight: 700 }}>{guest.fullName}</td>
                    <td>{guest.relationshipGroup || '—'}</td>
                    <td>{rsvpBadge}</td>
                    <td>{checkinBadge}</td>
                    <td>{guest.tableNumber ? `Table ${guest.tableNumber}` : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '6px' }}
                          onClick={() => {
                            setEditGuest(guest);
                            setFullName(guest.fullName);
                            setRelationshipGroup(guest.relationshipGroup || '');
                            setNeedsPhysicalCard(guest.needsPhysicalCard);
                            setTableNumber(guest.tableNumber || '');
                          }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '6px', color: 'var(--danger)' }}
                          onClick={() => handleDeleteGuest(guest)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredGuests.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No guests found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Guest Modal */}
      {(showAddModal || editGuest) && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">
                {editGuest ? 'Edit Guest Details' : 'Add Guest to Invitation'}
              </h3>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => {
                  setShowAddModal(false);
                  setEditGuest(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={editGuest ? handleEditGuest : handleAddGuest}>
              {!editGuest && (
                <div className="form-group">
                  <label className="form-label">Assign to Invitation</label>
                  <select
                    className="input-text"
                    value={selectedInvitationId}
                    onChange={(e) => setSelectedInvitationId(e.target.value)}
                    required
                  >
                    {invitations.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.primaryContactName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Relationship Group</label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="Bride Family / Highschool Friend"
                  value={relationshipGroup}
                  onChange={(e) => setRelationshipGroup(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Table Number (Optional)</label>
                <input
                  type="number"
                  className="input-text"
                  placeholder="5"
                  value={tableNumber}
                  onChange={(e) =>
                    setTableNumber(e.target.value ? Number(e.target.value) : '')
                  }
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editGuest ? 'Update Guest' : 'Add Guest'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditGuest(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Batch Import Guests (CSV)</h3>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowCsvModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCsvImport}>
              <div className="form-group">
                <label className="form-label">Select Household Invitation</label>
                <select
                  className="input-text"
                  value={selectedInvitationId}
                  onChange={(e) => setSelectedInvitationId(e.target.value)}
                  required
                >
                  {invitations.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.primaryContactName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Paste CSV Lines (fullName, relationshipGroup, tableNumber)
                </label>
                <textarea
                  className="input-text"
                  style={{ height: '140px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                  placeholder={`John Smith, Groom Family, 4\nJane Smith, Groom Family, 4`}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Import Guests
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowCsvModal(false)}
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
