import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Keyboard, LogOut, RefreshCw, Wifi, WifiOff } from 'lucide-react';
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

export const ScannerView: React.FC<ScannerViewProps> = ({
  token,
  staffInfo,
  onLogout,
  onCheckinResult,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [manualToken, setManualToken] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [queuedCount, setQueuedCount] = useState(getQueuedCheckins().length);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue(token, (count) => {
        setQueuedCount(getQueuedCheckins().length);
      });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check for offline queue sync
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
            handleQrScanned(decodedText);
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

  const handleQrScanned = async (guestQrToken: string) => {
    stopScanner();

    // Check offline mode
    if (!navigator.onLine) {
      // Find guest in local cache
      const cached = getGuestCache().find((g) => g.guestQrToken === guestQrToken);
      enqueueCheckin(guestQrToken, staffInfo?.stationId);
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
          guestQrToken,
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
          message: errorData.message || 'Invalid QR code or token.',
        });
      } else {
        const data = await res.json();
        onCheckinResult({
          type: 'success',
          title: 'Check-in Successful',
          guestName: data.checkin?.guest?.fullName,
          message: `Welcome! Checked in at ${staffInfo?.stationId || 'door station'}.`,
          wasRsvpd: data.wasRsvpd,
        });
      }
    } catch (e) {
      // Network error -> queue locally
      const cached = getGuestCache().find((g) => g.guestQrToken === guestQrToken);
      enqueueCheckin(guestQrToken, staffInfo?.stationId);
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

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleQrScanned(manualToken.trim());
    setManualToken('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Station Info Bar */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
        <div>
          <div style={{ fontWeight: 800 }}>{staffInfo?.name || 'Staff Operator'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Station: {staffInfo?.stationId || 'Door'}
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
            border: '1px solid var(--warning)',
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
            <div style={{ padding: '24px', color: 'var(--text-muted)' }}>
              <Camera size={48} style={{ marginBottom: '12px', opacity: 0.6 }} />
              <div>Camera is paused</div>
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
              style={{ backgroundColor: '#475569' }}
              onClick={stopScanner}
            >
              Pause Camera
            </button>
          )}
        </div>
      </div>

      {/* Manual Input Fallback */}
      <div className="card">
        <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Keyboard size={16} /> Manual Token Entry
        </div>
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="input-text"
            placeholder="Paste or type guestQrToken..."
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0 20px' }}>
            Check In
          </button>
        </form>
      </div>
    </div>
  );
};
