import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Event, Invitation } from '../types';
import { Mail, Plus, Edit, Copy, Check, Users, ExternalLink, X } from 'lucide-react';

interface InvitationsPageProps {
  event: Event | null;
}

export const InvitationsPage: React.FC<InvitationsPageProps> = ({ event }) => {
  const { fetchWithAuth } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editInv, setEditInv] = useState<Invitation | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form fields
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryChannel, setDeliveryChannel] = useState('whatsapp');
  const [partySizeAllowed, setPartySizeAllowed] = useState<number | ''>('');

  useEffect(() => {
    if (event) {
      loadInvitations();
    }
  }, [event]);

  const loadInvitations = async () => {
    if (!event) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/events/${event.id}/invitations`);
      if (res.ok) {
        const data: Invitation[] = await res.json();
        setInvitations(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    const payload = {
      primaryContactName,
      phone: phone || undefined,
      deliveryChannel: deliveryChannel || undefined,
      partySizeAllowed: partySizeAllowed !== '' ? Number(partySizeAllowed) : null,
    };

    try {
      if (editInv) {
        const res = await fetchWithAuth(
          `/api/events/${event.id}/invitations/${editInv.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(payload),
          },
        );
        if (res.ok) {
          setShowModal(false);
          setEditInv(null);
          loadInvitations();
        }
      } else {
        const res = await fetchWithAuth(`/api/events/${event.id}/invitations`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setShowModal(false);
          resetForm();
          loadInvitations();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setPrimaryContactName('');
    setPhone('');
    setDeliveryChannel('whatsapp');
    setPartySizeAllowed('');
  };

  const copyInviteUrl = (token: string) => {
    const url = `${window.location.origin.replace('3002', '3001')}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
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
          <h1 className="page-title">Invitations & Party Limits</h1>
          <p className="page-subtitle">
            Manage household invitation links, channels, and party size caps
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setEditInv(null);
            setShowModal(true);
          }}
        >
          <Plus size={16} /> New Invitation
        </button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Primary Contact / Household</th>
                <th>Party Cap (Allowed)</th>
                <th>RSVP Confirmed</th>
                <th>Delivery Channel</th>
                <th>Invite Link Token</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 700 }}>
                    {inv.primaryContactName}
                    {inv.phone && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {inv.phone}
                      </div>
                    )}
                  </td>
                  <td>
                    {inv.partySizeAllowed !== null && inv.partySizeAllowed !== undefined ? (
                      <span className="badge badge-warning">
                        Cap: {inv.partySizeAllowed}
                      </span>
                    ) : (
                      <span className="badge badge-neutral">Unlimited</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-success">
                      {inv.partySizeConfirmed ?? 0} confirmed
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-neutral">
                      {inv.deliveryChannel || 'Direct Link'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                        {inv.inviteLinkToken.slice(0, 10)}...
                      </code>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => copyInviteUrl(inv.inviteLinkToken)}
                      >
                        {copiedToken === inv.inviteLinkToken ? (
                          <Check size={12} style={{ color: 'var(--success)' }} />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '6px' }}
                        onClick={() => {
                          setEditInv(inv);
                          setPrimaryContactName(inv.primaryContactName);
                          setPhone(inv.phone || '');
                          setDeliveryChannel(inv.deliveryChannel || 'whatsapp');
                          setPartySizeAllowed(
                            inv.partySizeAllowed !== null && inv.partySizeAllowed !== undefined
                              ? inv.partySizeAllowed
                              : '',
                          );
                          setShowModal(true);
                        }}
                      >
                        <Edit size={14} />
                      </button>
                      <a
                        href={`http://localhost:3001/invite/${inv.inviteLinkToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline"
                        style={{ padding: '6px', color: 'var(--primary)' }}
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {invitations.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No invitations created yet. Click "New Invitation" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Invitation Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">
                {editInv ? 'Edit Invitation Settings' : 'Create New Household Invitation'}
              </h3>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Primary Contact / Household Name</label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="Smith Family / John & Partner"
                  value={primaryContactName}
                  onChange={(e) => setPrimaryContactName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="+1 (555) 019-2834"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Channel</label>
                <select
                  className="input-text"
                  value={deliveryChannel}
                  onChange={(e) => setDeliveryChannel(e.target.value)}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="paper">Physical Card</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Party Size Allowed (Leave empty for Unlimited)
                </label>
                <input
                  type="number"
                  className="input-text"
                  placeholder="e.g. 2 or leave blank"
                  value={partySizeAllowed}
                  onChange={(e) =>
                    setPartySizeAllowed(e.target.value ? Number(e.target.value) : '')
                  }
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editInv ? 'Save Changes' : 'Create Invitation'}
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
