import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock, Check } from 'lucide-react';

export interface CheckinResult {
  type: 'success' | 'queued' | 'conflict' | 'error';
  title: string;
  message: string;
  guestName?: string;
  wasRsvpd?: boolean;
  checkedInAt?: string;
  stationId?: string;
}

interface CheckinResultModalProps {
  result: CheckinResult | null;
  onClose: () => void;
}

export const CheckinResultModal: React.FC<CheckinResultModalProps> = ({
  result,
  onClose,
}) => {
  if (!result) return null;

  let icon = <CheckCircle size={36} color="var(--success)" />;
  let iconBg = 'var(--success-bg)';
  let borderColor = 'var(--success)';

  if (result.type === 'queued') {
    icon = <Clock size={36} color="var(--warning)" />;
    iconBg = 'var(--warning-bg)';
    borderColor = 'var(--warning)';
  } else if (result.type === 'conflict') {
    icon = <AlertTriangle size={36} color="var(--warning)" />;
    iconBg = 'var(--warning-bg)';
    borderColor = 'var(--warning)';
  } else if (result.type === 'error') {
    icon = <XCircle size={36} color="var(--danger)" />;
    iconBg = 'var(--danger-bg)';
    borderColor = 'var(--danger)';
  }

  return (
    <div className="result-modal" onClick={onClose}>
      <div
        className="result-card"
        style={{ borderColor }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="result-icon" style={{ backgroundColor: iconBg }}>
          {icon}
        </div>

        <h3 className="result-title">{result.title}</h3>

        {result.guestName && (
          <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px', color: '#ffffff' }}>
            {result.guestName}
          </div>
        )}

        <p className="result-desc">{result.message}</p>

        {result.wasRsvpd === false && (
          <div
            style={{
              fontSize: '0.8rem',
              backgroundColor: 'var(--warning-bg)',
              color: 'var(--warning)',
              padding: '6px 10px',
              borderRadius: '8px',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            ⚠️ Note: Guest had not confirmed RSVP prior to arrival
          </div>
        )}

        <button className="btn-primary" onClick={onClose}>
          Scan Next Guest
        </button>
      </div>
    </div>
  );
};
