import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, QrCode } from 'lucide-react';
import { Guest } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ConfirmationViewProps {
  guests: Guest[];
  onEditRsvp: () => void;
}

export const ConfirmationView: React.FC<ConfirmationViewProps> = ({
  guests,
  onEditRsvp,
}) => {
  const { t } = useLanguage();
  const attendingGuests = guests.filter((g) => g.isAttending === true);
  const decliningGuests = guests.filter((g) => g.isAttending === false);

  return (
    <div className="confirmation-container">
      <div className="hero-card">
        <div className="monogram" style={{ color: '#2e7d32', backgroundColor: '#edf7ed' }}>
          <CheckCircle size={32} />
        </div>
        <h1 className="confirmation-title">{t.rsvpConfirmedTitle}</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          {t.rsvpConfirmedSubtitle}
        </p>
      </div>

      <section className="info-card" style={{ marginTop: '24px' }}>
        <h2 className="section-title">
          <QrCode size={24} /> {t.digitalPassTitle}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          {t.digitalPassSubtitle}
        </p>

        {attendingGuests.length > 0 ? (
          <div className="qr-card-list">
            {attendingGuests.map((guest) => (
              <div key={guest.id} className="qr-card">
                <div className="qr-guest-name">{guest.fullName}</div>
                <div className="qr-table-info">
                  {guest.tableNumber ? `${t.tableNumber} ${guest.tableNumber}` : t.tableNotAssigned}
                  {guest.relationshipGroup ? ` • ${guest.relationshipGroup}` : ''}
                </div>

                <div className="qr-code-wrapper">
                  <QRCodeSVG
                    value={guest.guestQrToken}
                    size={160}
                    level="H"
                    includeMargin
                  />
                </div>

                <div className="qr-instruction">
                  {t.scanNotice}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="state-container" style={{ minHeight: '120px' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              {t.declined}
            </p>
          </div>
        )}

        {decliningGuests.length > 0 && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--card-border)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {t.declined}: {decliningGuests.map((g) => g.fullName).join(', ')}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onEditRsvp}
          className="btn-primary"
          style={{
            marginTop: '24px',
            backgroundColor: 'transparent',
            color: 'var(--primary-color)',
            border: '1.5px solid var(--primary-color)',
            boxShadow: 'none',
          }}
        >
          {t.editRsvp}
        </button>
      </section>
    </div>
  );
};
