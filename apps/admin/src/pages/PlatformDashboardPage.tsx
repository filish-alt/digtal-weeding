import React, { useEffect, useState } from 'react';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Shield,
  Crown,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Key,
  Plus,
  RefreshCw,
  Search,
  LogOut,
  Sun,
  Moon,
  Copy,
  Check,
  Building,
  Radio,
  Trash2,
  Calendar,
} from 'lucide-react';

interface TenantItem {
  id: string;
  ownerEmail: string;
  ownerName: string;
  status: 'pending' | 'active' | 'suspended';
  approvedAt?: string | null;
  approvedBy?: string | null;
  createdAt: string;
  _count?: {
    events: number;
  };
}

interface EventItem {
  id: string;
  coupleNames: string;
  slug: string;
  eventDate: string;
  venue: string;
  tenant: {
    id: string;
    ownerName: string;
    ownerEmail: string;
    status: string;
  };
  _count?: {
    staff: number;
    invitations: number;
  };
}

interface StaffItem {
  id: string;
  name: string;
  stationId?: string;
  pinCode?: string;
  tokenExpiresAt?: string | null;
  createdAt: string;
  isRevoked?: boolean;
}

export const PlatformDashboardPage: React.FC = () => {
  const { adminUser, logoutPlatform, fetchWithPlatformAuth } = usePlatformAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'tenants' | 'staff'>('tenants');
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [staffList, setStaffList] = useState<StaffItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Create Staff Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStationId, setNewStationId] = useState('gate-1');
  const [newPinCode, setNewPinCode] = useState('');
  const [createdPinResult, setCreatedPinResult] = useState<{ name: string; pin: string } | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);

  useEffect(() => {
    loadTenants();
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadEventStaff(selectedEventId);
    }
  }, [selectedEventId]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 5000);
  };

  const loadTenants = async () => {
    try {
      setLoading(true);
      const res = await fetchWithPlatformAuth('/api/platform/tenants');
      if (res.ok) {
        const data = await res.json();
        setTenants(data);
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to fetch tenants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const res = await fetchWithPlatformAuth('/api/platform/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        if (data.length > 0 && !selectedEventId) {
          setSelectedEventId(data[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch events', err);
    }
  };

  const loadEventStaff = async (eventId: string) => {
    try {
      const res = await fetchWithPlatformAuth(`/api/platform/events/${eventId}/staff`);
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch (err: any) {
      showNotification('Failed to load event staff accounts', 'error');
    }
  };

  const handleApprove = async (tenantId: string, name: string) => {
    try {
      const res = await fetchWithPlatformAuth(`/api/platform/tenants/${tenantId}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        showNotification(`🎉 Tenant "${name}" has been approved! An activation email was logged.`);
        loadTenants();
      } else {
        const err = await res.json();
        showNotification(err.message || 'Approval failed', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Approval request failed', 'error');
    }
  };

  const handleSuspend = async (tenantId: string, name: string) => {
    if (!confirm(`Are you sure you want to suspend tenant "${name}"?`)) return;
    try {
      const res = await fetchWithPlatformAuth(`/api/platform/tenants/${tenantId}/suspend`, {
        method: 'POST',
      });
      if (res.ok) {
        showNotification(`Tenant "${name}" has been suspended.`, 'success');
        loadTenants();
      } else {
        const err = await res.json();
        showNotification(err.message || 'Suspension failed', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Suspension request failed', 'error');
    }
  };

  const generateRandomPin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setNewPinCode(pin);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;

    try {
      const pinToSend = newPinCode.trim() || Math.floor(100000 + Math.random() * 900000).toString();
      const res = await fetchWithPlatformAuth(`/api/platform/events/${selectedEventId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStaffName,
          stationId: newStationId,
          pinCode: pinToSend,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create staff account');
      }

      const data = await res.json();
      setCreatedPinResult({ name: data.name, pin: data.pinCode });
      loadEventStaff(selectedEventId);
      loadEvents();
      setNewStaffName('');
      setNewStationId('gate-1');
      setNewPinCode('');
    } catch (err: any) {
      showNotification(err.message || 'Failed to create staff', 'error');
    }
  };

  const handleRevokeStaff = async (staffId: string, staffName: string) => {
    if (!confirm(`Revoke security PIN access for "${staffName}"?`)) return;
    try {
      const res = await fetchWithPlatformAuth(`/api/platform/events/${selectedEventId}/staff/${staffId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showNotification(`Staff access for "${staffName}" was revoked.`, 'success');
        loadEventStaff(selectedEventId);
      }
    } catch (err: any) {
      showNotification(err.message || 'Revocation failed', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  // Stats calculation
  const totalTenants = tenants.length;
  const pendingTenantsCount = tenants.filter((t) => t.status === 'pending').length;
  const activeTenantsCount = tenants.filter((t) => t.status === 'active').length;
  const totalEvents = events.length;

  const filteredTenants = tenants.filter((t) => {
    const matchesStatus = statusFilter === 'all' ? true : t.status === statusFilter;
    const matchesSearch =
      t.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      {/* Top Navbar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 36px',
          background: 'var(--bg-card)',
          borderBottom: '1.5px solid var(--border-color)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)',
            }}
          >
            <Crown size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Platform Superadmin
              </h1>
              <span
                style={{
                  background: 'var(--cta-light)',
                  color: 'var(--cta)',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  border: '1px solid var(--cta)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Control Portal
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Logged in as {adminUser?.name || 'Administrator'} ({adminUser?.email || 'admin@platform.com'})
            </div>
          </div>
        </div>

        {/* Right tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={logoutPlatform}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', padding: '8px 14px' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px 36px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Notification Banner */}
        {actionMessage && (
          <div
            style={{
              padding: '14px 20px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 700,
              fontSize: '0.92rem',
              backgroundColor: actionMessage.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
              color: actionMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
              border: `1.5px solid ${actionMessage.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
            }}
          >
            {actionMessage.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="stats-grid" style={{ marginBottom: '32px' }}>
          <div className="stat-card">
            <div className="stat-header">
              <span>Pending Approvals</span>
              <Clock size={20} color="#f59e0b" />
            </div>
            <div className="stat-value" style={{ color: pendingTenantsCount > 0 ? '#e11d48' : 'var(--text-main)' }}>
              {pendingTenantsCount}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Active Couples</span>
              <CheckCircle2 size={20} color="#059669" />
            </div>
            <div className="stat-value">{activeTenantsCount}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Total Signups</span>
              <Users size={20} color="#7c3aed" />
            </div>
            <div className="stat-value">{totalTenants}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Wedding Events</span>
              <Calendar size={20} color="#d97706" />
            </div>
            <div className="stat-value">{totalEvents}</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid var(--border-color)', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('tenants')}
            style={{
              padding: '12px 24px',
              fontWeight: 800,
              fontSize: '0.98rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: activeTab === 'tenants' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'tenants' ? '3px solid var(--primary)' : '3px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s ease',
            }}
          >
            <Crown size={20} />
            <span>Couple Signups & Approvals</span>
            {pendingTenantsCount > 0 && (
              <span
                style={{
                  background: '#e11d48',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                {pendingTenantsCount} new
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            style={{
              padding: '12px 24px',
              fontWeight: 800,
              fontSize: '0.98rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: activeTab === 'staff' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'staff' ? '3px solid var(--primary)' : '3px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s ease',
            }}
          >
            <Shield size={20} />
            <span>Door Staff & Security PINs</span>
          </button>
        </div>

        {/* TAB 1: TENANTS & APPROVALS */}
        {activeTab === 'tenants' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['all', 'pending', 'active', 'suspended'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      border: '1.5px solid',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      borderColor: statusFilter === st ? 'var(--primary)' : 'var(--border-color)',
                      backgroundColor: statusFilter === st ? 'var(--primary-light)' : 'transparent',
                      color: statusFilter === st ? 'var(--primary)' : 'var(--text-muted)',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {st === 'pending' ? `Pending (${pendingTenantsCount})` : st}
                  </button>
                ))}
              </div>

              {/* Search & Refresh */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search by couple name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-text"
                    style={{ paddingLeft: '36px', width: '280px', height: '40px' }}
                  />
                </div>
                <button onClick={loadTenants} className="btn btn-outline" title="Refresh tenant list">
                  <RefreshCw size={16} className={loading ? 'spinner' : ''} />
                </button>
              </div>
            </div>

            {/* Tenants Data Table */}
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Couple / Owner Name</th>
                    <th>Account Email</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Events</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No tenant accounts found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{t.ownerName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {t.id}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{t.ownerEmail}</span>
                        </td>
                        <td>
                          {t.status === 'pending' && <span className="badge badge-warning">⏳ Awaiting Approval</span>}
                          {t.status === 'active' && <span className="badge badge-success">✅ Active</span>}
                          {t.status === 'suspended' && <span className="badge badge-danger">⛔ Suspended</span>}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>{new Date(t.createdAt).toLocaleDateString()}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700 }}>{t._count?.events || 0} events</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            {t.status !== 'active' && (
                              <button
                                onClick={() => handleApprove(t.id, t.ownerName)}
                                className="btn btn-primary"
                                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                              >
                                <CheckCircle2 size={15} />
                                <span>Approve</span>
                              </button>
                            )}

                            {t.status === 'active' && (
                              <button
                                onClick={() => handleSuspend(t.id, t.ownerName)}
                                className="btn btn-outline"
                                style={{ padding: '6px 14px', fontSize: '0.82rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                              >
                                <XCircle size={15} />
                                <span>Suspend</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DOOR STAFF & SECURITY PINS */}
        {activeTab === 'staff' && (
          <div>
            {/* Event Selector Bar */}
            <div className="card" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '280px' }}>
                  <label style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                    Select Wedding Event:
                  </label>
                  <select
                    className="input-text"
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    style={{ flex: 1, maxWidth: '460px' }}
                  >
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.coupleNames} — {evt.venue} ({new Date(evt.eventDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    generateRandomPin();
                    setCreatedPinResult(null);
                    setIsStaffModalOpen(true);
                  }}
                  className="btn btn-primary"
                  disabled={!selectedEventId}
                >
                  <Plus size={18} />
                  <span>Create Door Staff PIN</span>
                </button>
              </div>

              {selectedEvent && (
                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    gap: '24px',
                    fontSize: '0.86rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div>
                    <strong>Couple:</strong> {selectedEvent.coupleNames}
                  </div>
                  <div>
                    <strong>Venue:</strong> {selectedEvent.venue}
                  </div>
                  <div>
                    <strong>Date:</strong> {new Date(selectedEvent.eventDate).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Event UUID:</strong> <code style={{ userSelect: 'all' }}>{selectedEvent.id}</code>
                  </div>
                </div>
              )}
            </div>

            {/* Staff Accounts List */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Door Scanner Accounts ({staffList.length})
                </h3>
                <button onClick={() => selectedEventId && loadEventStaff(selectedEventId)} className="btn btn-outline">
                  <RefreshCw size={16} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Staff Lead Name</th>
                      <th>Station ID</th>
                      <th>Access Status</th>
                      <th>Created</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No door staff accounts configured for this event yet. Click "Create Door Staff PIN" to issue access.
                        </td>
                      </tr>
                    ) : (
                      staffList.map((st) => (
                        <tr key={st.id}>
                          <td>
                            <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{st.name}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ID: {st.id}</div>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'var(--primary-light)',
                                color: 'var(--primary)',
                                padding: '4px 10px',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                              }}
                            >
                              <Radio size={14} />
                              {st.stationId || 'Main Entrance'}
                            </span>
                          </td>
                          <td>
                            {st.isRevoked ? (
                              <span className="badge badge-danger">⛔ Revoked / Expired</span>
                            ) : (
                              <span className="badge badge-success">🟢 Active Scanner</span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: '0.84rem' }}>{new Date(st.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {!st.isRevoked && (
                              <button
                                onClick={() => handleRevokeStaff(st.id, st.name)}
                                className="btn btn-outline"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.82rem',
                                  color: 'var(--danger)',
                                  borderColor: 'var(--danger)',
                                }}
                              >
                                <Trash2 size={14} />
                                <span>Revoke PIN</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CREATE STAFF MODAL */}
      {isStaffModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">Create Door Staff PIN</h2>
              <button
                onClick={() => {
                  setIsStaffModalOpen(false);
                  setCreatedPinResult(null);
                }}
                className="btn btn-outline"
                style={{ padding: '6px 10px' }}
              >
                ✕
              </button>
            </div>

            {createdPinResult ? (
              <div>
                <div
                  style={{
                    backgroundColor: 'var(--success-light)',
                    border: '1.5px solid var(--success)',
                    color: 'var(--success)',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '20px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px' }}>
                    🎉 Staff PIN Generated Successfully!
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>
                    Share this PIN and Station ID with <strong>{createdPinResult.name}</strong> for door check-in access.
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--section-bg)',
                    border: '1px solid var(--border-color)',
                    padding: '20px',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Security PIN Code
                  </div>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '2.4rem',
                      fontWeight: 800,
                      letterSpacing: '8px',
                      color: 'var(--primary)',
                      marginBottom: '16px',
                    }}
                  >
                    {createdPinResult.pin}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdPinResult.pin)}
                    className="btn btn-primary"
                    style={{ margin: '0 auto', display: 'inline-flex', gap: '8px' }}
                  >
                    {copiedPin ? <Check size={18} /> : <Copy size={18} />}
                    <span>{copiedPin ? 'PIN Copied!' : 'Copy PIN Code'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsStaffModalOpen(false);
                    setCreatedPinResult(null);
                  }}
                  className="btn btn-outline"
                  style={{ width: '100%' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateStaff}>
                <div className="form-group">
                  <label className="form-label">Staff / Scanner Lead Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gate 1 Entrance Staff"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="input-text"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Station ID / Gate Identifier</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. gate-1 / tablet-north"
                    value={newStationId}
                    onChange={(e) => setNewStationId(e.target.value)}
                    className="input-text"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned 6-Digit PIN Code</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      maxLength={8}
                      placeholder="6-digit PIN"
                      value={newPinCode}
                      onChange={(e) => setNewPinCode(e.target.value)}
                      className="input-text"
                      style={{ fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: '4px' }}
                    />
                    <button
                      type="button"
                      onClick={generateRandomPin}
                      className="btn btn-outline"
                      title="Generate new random PIN"
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Auto-generates a secure 6-digit PIN if left unchanged.
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={() => setIsStaffModalOpen(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Key size={18} />
                    <span>Generate & Issue PIN</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
