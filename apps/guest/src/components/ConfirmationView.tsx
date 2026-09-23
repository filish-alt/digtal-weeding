import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, QrCode, KeyRound, Info } from 'lucide-react';
import { Guest } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatGuestPassCode, formatInvitationCode } from '../utils/passcode';

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
  const primaryInvitationId = guests[0]?.invitationId;

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

        {primaryInvitationId && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
              padding: '6px 18px',
              borderRadius: '999px',
              background: 'var(--cta-light)',
              border: '1.5px solid var(--cta-color)',
              color: 'var(--cta-color)',
              fontWeight: 800,
              fontSize: '0.92rem',
              letterSpacing: '1px',
            }}
          >
            <KeyRound size={16} />
            <span>{t.passcodeNotice} <code>{formatInvitationCode(primaryInvitationId)}</code></span>
          </div>
        )}
      </div>

      <section className="info-card" style={{ marginTop: '24px' }}>
        <h2 className="section-title">
          <QrCode size={24} /> {t.digitalPassTitle}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          {t.digitalPassSubtitle}
        </p>

        {/* Fallback Notice for Guests without QR Scanner / Printing */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px 16px',
            background: 'var(--verse-bg)',
            border: '1.5px solid var(--verse-border)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            fontSize: '0.86rem',
            color: 'var(--text-dark)',
            lineHeight: 1.5,
          }}
        >
          <Info size={18} style={{ color: 'var(--cta-color)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>{t.passcodeLabel}:</strong> {t.cantScanNotice}
          </div>
        </div>

        {attendingGuests.length > 0 ? (
          <div className="qr-card-list">
            {attendingGuests.map((guest) => {
              const passCode = formatGuestPassCode(guest.id || guest.guestQrToken);
              return (
                <div key={guest.id} className="qr-card">
                  <div className="qr-guest-name">{guest.fullName}</div>

                  <div className="qr-badges-row">
                    {guest.tableNumber ? (
                      <span className="qr-table-badge">
                        {t.tableNumber}: {guest.tableNumber}
                      </span>
                    ) : null}
                    {guest.relationshipGroup ? (
                      <span className="qr-group-badge">
                        {guest.relationshipGroup}
                      </span>
                    ) : null}
                    {!guest.tableNumber && !guest.relationshipGroup && (
                      <span className="qr-guest-badge">
                        {t.attending}
                      </span>
                    )}
                  </div>

                  <div className="qr-code-wrapper">
                    <QRCodeSVG
                      value={guest.guestQrToken}
                      size={170}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  {/* Unique Passcode Box */}
                  <div className="qr-passcode-box">
                    <KeyRound size={14} style={{ color: '#d97706' }} />
                    <span>{t.passcodeNotice}</span>
                    <span className="qr-passcode-code">{passCode}</span>
                  </div>

                  <div className="qr-instruction">
                    {t.scanNotice}
                  </div>
                </div>
              );
            })}
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
