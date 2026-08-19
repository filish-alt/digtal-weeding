import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Event, LiveCheckinStats } from '../types';
import { Activity, Users, CheckCircle, Percent, RefreshCw } from 'lucide-react';

interface LiveCheckinPageProps {
  event: Event | null;
}

export const LiveCheckinPage: React.FC<LiveCheckinPageProps> = ({ event }) => {
  const { fetchWithAuth } = useAuth();
  const [data, setData] = useState<LiveCheckinStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!event) return;

    loadCheckins();
    const interval = setInterval(() => {
      loadCheckins(true);
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [event]);

  const loadCheckins = async (silent = false) => {
    if (!event) return;
    if (!silent) setLoading(true);
    setIsRefreshing(true);

    try {
      const res = await fetchWithAuth(`/api/events/${event.id}/checkins`);
      if (res.ok) {
        const stats: LiveCheckinStats = await res.json();
        setData(stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
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
          <h1 className="page-title">Live Day-of Check-in Dashboard</h1>
          <p className="page-subtitle">
            Real-time check-in stream and attendance progress for {event.coupleNames}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-success" style={{ padding: '6px 12px' }}>
            <Activity size={14} className="animate-pulse" /> Live Polling Active (3s)
          </span>
          <button
            className="btn btn-outline"
            style={{ padding: '6px 10px' }}
            onClick={() => loadCheckins()}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span>Checked In Now</span>
            <CheckCircle size={20} style={{ color: 'var(--success)' }} />
          </div>
          <div className="stat-value">{data?.stats.totalCheckedIn ?? 0}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Confirmed Guests</span>
            <Users size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="stat-value">{data?.stats.totalConfirmedGuests ?? 0}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Total Household Guests</span>
            <Users size={20} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="stat-value">{data?.stats.totalGuests ?? 0}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Attendance Rate</span>
            <Percent size={20} style={{ color: 'var(--warning)' }} />
          </div>
          <div className="stat-value">{data?.stats.checkinRate ?? '0%'}</div>
        </div>
      </div>

      {/* Live Stream Table */}
      <div className="card">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>
          Recent Door Check-ins
        </h2>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Guest Name</th>
                <th>Household / Contact</th>
                <th>Station</th>
                <th>Check-in Time</th>
                <th>RSVP Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.checkins.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 700 }}>{item.guest?.fullName}</td>
                  <td>{item.guest?.invitation?.primaryContactName || '—'}</td>
                  <td>
                    <span className="badge badge-neutral">
                      {item.stationId || 'gate-1'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {new Date(item.checkedInAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td>
                    {item.guest?.isAttending === true ? (
                      <span className="badge badge-success">Confirmed RSVP</span>
                    ) : (
                      <span className="badge badge-warning">Walk-in / Unconfirmed</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!data?.checkins || data.checkins.length === 0) && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No guests checked in yet today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
