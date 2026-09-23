import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  LogOut,
  Wifi,
  WifiOff,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { CheckinResult } from './CheckinResultModal';
import {
  enqueueCheckin,
  getGuestCache,
  processOfflineQueue,
  getQueuedCheckins,
} from '../services/db';
import { getApiUrl } from '../utils/api';

interface ScannerViewProps {
  token: string;
  staffInfo: any;
  onLogout: () => void;
  onCheckinResult: (result: CheckinResult) => void;
}

interface LookupGuest {
  id: string;
  fullName: string;
  tableNumber?: number | null;
  relationshipGroup?: string | null;
  isAttending?: boolean | null;
  guestQrToken: string;
  passcode: string;
  invitationCode: string;
  invitation?: {
    id: string;
    primaryContactName: string;
    phone?: string;
  };
  isCheckedIn: boolean;
  checkedInAt?: string | null;
  stationId?: string | null;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  token,
  staffInfo,
  onLogout,
  onCheckinResult,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LookupGuest[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [queuedCount, setQueuedCount] = useState(getQueuedCheckins().length);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const searchTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue(token, () => {
        setQueuedCount(getQueuedCheckins().length);
      });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      processOfflineQueue(token, () => {
        setQueuedCount(getQueuedCheckins().length);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      stopScanner();
    };
  }, [token]);

  // Live lookup when user types a passcode, name, or phone number
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      if (isOnline) {
        try {
          const res = await fetch(
            getApiUrl(`/api/checkins/lookup?q=${encodeURIComponent(q)}`),
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data);
          }
        } catch (e) {
          console.error('Failed to lookup guests online', e);
          fallbackOfflineSearch(q);
        } finally {
          setIsSearching(false);
        }
      } else {
        fallbackOfflineSearch(q);
        setIsSearching(false);
      }
    }, 280);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, isOnline, token]);

  const fallbackOfflineSearch = (q: string) => {
    const cached = getGuestCache();
    const clean = q.replace(/^INV-|^PASS-|^#/i, '').toLowerCase();
    const matches: LookupGuest[] = cached
      .filter(
        (g) =>
          (g.fullName && g.fullName.toLowerCase().includes(clean)) ||
          (g.id && g.id.toLowerCase().startsWith(clean)) ||
          (g.guestQrToken && g.guestQrToken.toLowerCase().startsWith(clean)),
      )
      .map((g) => ({
        id: g.id || '',
        fullName: g.fullName || 'Guest',
        tableNumber: undefined,
        relationshipGroup: undefined,
        isAttending: g.isAttending,
        guestQrToken: g.guestQrToken || '',
        passcode: `PASS-${(g.id || '').replace(/-/g, '').slice(0, 6).toUpperCase()}`,
        invitationCode: 'INV-OFFLINE',
        isCheckedIn: false,
      }));
    setSearchResults(matches);
  };

  const startScanner = async () => {
    setIsScanning(true);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          if (!isProcessingRef.current) {
            isProcessingRef.current = true;
            handleCheckin(decodedText);
          }
        },
        () => {},
      );
    } catch (e) {
      console.warn('Camera access error or scanner start failed', e);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }
    setIsScanning(false);
  };

  const handleCheckin = async (identifier: string) => {
    stopScanner();

    // Check offline mode
    if (!navigator.onLine) {
      const cached = getGuestCache().find(
        (g) =>
          g.guestQrToken === identifier ||
          g.id?.startsWith(identifier.replace(/^INV-|^PASS-|^#/i, '').toLowerCase()),
      );
      enqueueCheckin(identifier, staffInfo?.stationId);
      setQueuedCount(getQueuedCheckins().length);

      onCheckinResult({
        type: 'queued',
        title: 'Check-in Queued (Offline)',
        guestName: cached?.fullName || 'Guest',
        message: 'No internet connection. Saved locally — will sync automatically when online.',
        wasRsvpd: cached?.isAttending === true,
      });

      setTimeout(() => {
        isProcessingRef.current = false;
      }, 2000);
      return;
    }

    // Online check-in POST
    try {
      const res = await fetch(getApiUrl('/api/checkins'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          guestQrToken: identifier,
          stationId: staffInfo?.stationId,
        }),
      });

      if (res.status === 409) {
        const conflictData = await res.json().catch(() => ({}));
        onCheckinResult({
          type: 'conflict',
          title: 'Already Checked In',
          message: conflictData.message || 'Guest has already been checked in today.',
        });
      } else if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        onCheckinResult({
          type: 'error',
          title: 'Check-in Failed',
          message: errorData.message || 'Invalid passcode or QR token.',
        });
      } else {
        const data = await res.json();
        onCheckinResult({
          type: 'success',
          title: 'Check-in Successful',
          guestName: data.checkin?.guest?.fullName,
          message: `Welcome! Checked in at ${staffInfo?.stationId || 'entrance'}.`,
          wasRsvpd: data.wasRsvpd,
        });

        // Update local search results state if present
        setSearchResults((prev) =>
          prev.map((g) =>
            g.id === data.checkin?.guest?.id || g.guestQrToken === identifier
              ? { ...g, isCheckedIn: true, checkedInAt: new Date().toISOString() }
              : g,
          ),
        );
      }
    } catch (e) {
      // Network error -> queue locally
      const cached = getGuestCache().find((g) => g.guestQrToken === identifier);
      enqueueCheckin(identifier, staffInfo?.stationId);
      setQueuedCount(getQueuedCheckins().length);

      onCheckinResult({
        type: 'queued',
        title: 'Network Interrupted — Queued',
        guestName: cached?.fullName || 'Guest',
        message: 'Network failed. Saved locally — will retry automatically on reconnect.',
        wasRsvpd: cached?.isAttending === true,
      });
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1500);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    handleCheckin(searchQuery.trim());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Station Info Bar */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
        <div>
          <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{staffInfo?.name || 'Staff Operator'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Station: {staffInfo?.stationId || 'Main Entrance'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isOnline ? (
            <span className="status-badge status-online">
              <Wifi size={12} /> Online
            </span>
          ) : (
            <span className="status-badge status-offline">
              <WifiOff size={12} /> Offline
            </span>
          )}

          <button
            onClick={onLogout}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Queued Items Banner */}
      {queuedCount > 0 && (
        <div
          style={{
            backgroundColor: 'var(--warning-bg)',
            border: '1px solid #fde68a',
            color: 'var(--warning)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>⏳ {queuedCount} check-in(s) queued for sync</span>
          {isOnline && (
            <button
              onClick={() => processOfflineQueue(token, () => setQueuedCount(getQueuedCheckins().length))}
              style={{ background: 'none', border: 'none', color: 'var(--warning)', fontWeight: 800, cursor: 'pointer' }}
            >
              Sync Now
            </button>
          )}
        </div>
      )}

      {/* Camera Scanner Viewport */}
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="scanner-viewport">
          <div id="qr-reader" />
          {!isScanning && (
            <div style={{ padding: '24px', color: '#94a3b8' }}>
              <Camera size={48} style={{ marginBottom: '12px', opacity: 0.8, color: '#f59e0b' }} />
              <div style={{ fontWeight: 700, color: '#f8fafc' }}>Camera Scanner Paused</div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.85, color: '#cbd5e1' }}>Scan guest QR codes directly</div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '16px' }}>
          {!isScanning ? (
            <button className="btn-primary" onClick={startScanner}>
              Start Camera Scanner
            </button>
          ) : (
            <button
              className="btn-primary"
              style={{ backgroundColor: '#64748b', backgroundImage: 'none' }}
              onClick={stopScanner}
            >
              Pause Camera
            </button>
          )}
        </div>
      </div>

      {/* Passcode & Name Search / Manual Lookup */}
      <div className="card">
        <div style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '10px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Search size={16} /> Passcode / Name Lookup (No QR Needed)
        </div>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="input-text"
            placeholder="Type code (e.g. INV-C8A301) or guest name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0 18px', whiteSpace: 'nowrap' }}>
            Check In
          </button>
        </form>

        {isSearching && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Searching guests...
          </div>
        )}

        {/* Live Search Results */}
        {searchResults.length > 0 && (
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Found {searchResults.length} Matching Guest(s):
            </div>
            {searchResults.map((guest) => (
              <div
                key={guest.id}
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                      {guest.fullName}
                    </span>
                    <span
                      style={{
                        background: '#fef3c7',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {guest.invitationCode}
                    </span>
                    {guest.passcode && (
                      <span
                        style={{
                          background: '#ffe4e6',
                          color: '#be123c',
                          border: '1px solid #fecdd3',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {guest.passcode}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                    {guest.tableNumber && (
                      <span style={{ background: '#e2e8f0', color: '#334155', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        Table {guest.tableNumber}
                      </span>
                    )}
                    {guest.relationshipGroup && (
                      <span style={{ background: '#e2e8f0', color: '#334155', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        {guest.relationshipGroup}
                      </span>
                    )}
                    {guest.isAttending === true ? (
                      <span style={{ color: '#059669', fontWeight: 700 }}>✓ RSVP Confirmed</span>
                    ) : guest.isAttending === false ? (
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>Declined</span>
                    ) : (
                      <span style={{ color: '#d97706', fontWeight: 700 }}>Pending RSVP</span>
                    )}
                  </div>
                </div>

                <div>
                  {guest.isCheckedIn ? (
                    <div
                      style={{
                        background: 'var(--success-bg)',
                        color: 'var(--success)',
                        border: '1px solid #a7f3d0',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircle2 size={14} /> In
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckin(guest.guestQrToken || guest.passcode || guest.id)}
                      className="btn-primary"
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.82rem',
                        borderRadius: '8px',
                        width: 'auto',
                      }}
                    >
                      Pass / In
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
