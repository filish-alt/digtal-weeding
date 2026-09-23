import React, { useState } from 'react';
import { ShieldCheck, Key, MapPin, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { saveGuestCache } from '../services/db';
import { getApiUrl } from '../utils/api';

interface PinLoginProps {
  onLoginSuccess: (token: string, staffInfo: any) => void;
}

export const PinLogin: React.FC<PinLoginProps> = ({ onLoginSuccess }) => {
  const [eventId, setEventId] = useState('');
  const [stationId, setStationId] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);

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
            backgroundColor: '#ffe4e6',
            color: 'var(--primary)',
            marginBottom: '12px',
          }}
        >
          <ShieldCheck size={36} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>Staff Door Login</h2>
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
          <div style={{ position: 'relative' }}>
            <input
              type={showPin ? 'text' : 'password'}
              className="input-text"
              placeholder="••••"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              style={{ paddingRight: '44px' }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={showPin ? 'Hide PIN' : 'Show PIN'}
            >
              {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Authenticating...' : 'Unlock Scanner'}
        </button>
      </form>
    </div>
  );
};
