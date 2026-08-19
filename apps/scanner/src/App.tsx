import React, { useState } from 'react';
import { PinLogin } from './components/PinLogin';
import { ScannerView } from './components/ScannerView';
import { CheckinResultModal, CheckinResult } from './components/CheckinResultModal';
import { QrCode } from 'lucide-react';

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('staff_jwt_token');
  });

  const [staffInfo, setStaffInfo] = useState<any>(() => {
    const raw = localStorage.getItem('staff_info');
    return raw ? JSON.parse(raw) : null;
  });

  const [scanResult, setScanResult] = useState<CheckinResult | null>(null);

  const handleLoginSuccess = (jwt: string, info: any) => {
    localStorage.setItem('staff_jwt_token', jwt);
    localStorage.setItem('staff_info', JSON.stringify(info));
    setToken(jwt);
    setStaffInfo(info);
  };

  const handleLogout = () => {
    localStorage.removeItem('staff_jwt_token');
    localStorage.removeItem('staff_info');
    setToken(null);
    setStaffInfo(null);
  };

  return (
    <div className="pwa-app">
      <header className="pwa-header">
        <div className="pwa-title">
          <QrCode style={{ color: 'var(--primary)' }} size={22} /> Door Check-in PWA
        </div>
      </header>

      <main className="pwa-body">
        {!token ? (
          <PinLogin onLoginSuccess={handleLoginSuccess} />
        ) : (
          <ScannerView
            token={token}
            staffInfo={staffInfo}
            onLogout={handleLogout}
            onCheckinResult={(res) => setScanResult(res)}
          />
        )}
      </main>

      <CheckinResultModal
        result={scanResult}
        onClose={() => setScanResult(null)}
      />
    </div>
  );
};
