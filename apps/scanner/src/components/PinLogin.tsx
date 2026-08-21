import React, { useState } from 'react';
import { ShieldCheck, Key, MapPin, AlertCircle } from 'lucide-react';
import { saveGuestCache } from '../services/db';
import { getApiUrl } from '../utils/api';

interface PinLoginProps {
  onLoginSuccess: (token: string, staffInfo: any) => void;
}

export const PinLogin: React.FC<PinLoginProps> = ({ onLoginSuccess }) => {
  const [eventId, setEventId] = useState('');
  const [stationId, setStationId] = useState('');
  const [pinCode, setPinCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(getApiUrl(`/api/events/${eventId}/staff/login`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId, pinCode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Invalid station ID or PIN code');
      }

      const data = await res.json();
      const token = data.access_token;

      // Cache guest list locally for offline access
      try {
        const guestRes = await fetch(getApiUrl(`/api/events/${eventId}/guests`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (guestRes.ok) {
          const guests = await guestRes.json();
          saveGuestCache(guests);
        }
      } catch (e) {
        console.warn('Could not fetch guest list for offline cache', e);
      }

      onLoginSuccess(token, data.staffAccount);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '40px auto 0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            display: 'inline-flex',
            padding: '16px',
            borderRadius: '50%',
            backgroundColor: '#312e81',
            color: '#818cf8',
            marginBottom: '12px',
          }}
        >
          <ShieldCheck size={36} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Staff Door Login</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Enter your assigned event ID, station, and security PIN code
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            EVENT ID
          </label>
          <input
            type="text"
            className="input-text"
            placeholder="Paste event UUID or ID"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            STATION ID
          </label>
          <input
            type="text"
            className="input-text"
            placeholder="gate-1 / tablet-main"
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            PIN CODE
          </label>
          <input
            type="password"
            className="input-text"
            placeholder="••••"
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Authenticating...' : 'Unlock Scanner'}
        </button>
      </form>
    </div>
  );
};
