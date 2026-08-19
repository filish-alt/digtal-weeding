import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Heart, Calendar, MapPin, QrCode, Sparkles, Globe } from 'lucide-react';
import { Invitation } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatSideBySideDates } from '../utils/ethiopianDate';

interface PhysicalCardViewProps {
  invitation: Invitation;
}

export const PhysicalCardView: React.FC<PhysicalCardViewProps> = ({ invitation }) => {
  const { language } = useLanguage();
  const event = invitation.event;
  const guests = invitation.guests || [];

  const handlePrint = () => {
    window.print();
  };

  // Formatted Side-by-Side Dates
  const sideBySide = formatSideBySideDates(event?.eventDate, 'am');
  const eventDateObj = event?.eventDate ? new Date(event.eventDate) : null;
  const gregorianTime = eventDateObj
    ? eventDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="physical-card-container">
      {/* Print Action Bar (Hidden on Print) */}
      <div className="no-print print-action-bar">
        <div className="print-notice-info">
          <Sparkles size={20} className="sparkle-icon" />
          <div>
            <strong>የአካል የግብዣ ካርድ (Physical Wedding Invitation)</strong>
            <p>ይህ የግብዣ ካርድ ለማተም የተዘጋጀ ነው። ከታች ያለውን "ካርዱን አትም" የሚለውን ቁልፍ በመጫን ማተም ይችላሉ።</p>
          </div>
        </div>

        <button type="button" onClick={handlePrint} className="btn-print">
          <Printer size={20} />
          <span>የግብዣ ካርዱን አትም (Print Card)</span>
        </button>
      </div>

      {/* Printable Double-Sided Card Frame */}
      <div className="printable-cards-wrapper">
        {/* =========================================================
            FRONT SIDE: WEDDING INVITATION & EVENT DETAILS (የፊት ገጽ)
        ========================================================= */}
        <div className="print-card-sheet print-card-front">
          <div className="print-card-border">
            <div className="print-corner top-left">❦</div>
            <div className="print-corner top-right">❦</div>
            <div className="print-corner bottom-left">❦</div>
            <div className="print-corner bottom-right">❦</div>

            <div className="print-header">
              <div className="print-gold-badge">የሰርግ ጥሪ ግብዣ</div>
              <div className="print-monogram">
                <Heart size={28} />
              </div>
              {/* <div className="print-salutation">
                በስመ አብ ወወልድ ወመንፈስ ቅዱስ አሐዱ አምላክ አሜን
              </div> */}
            </div>

            {event?.photoUrl && (
              <div className="print-photo-wrapper">
                <img src={event.photoUrl} alt={event.coupleNames} className="print-photo" />
              </div>
            )}

            <h1 className="print-couple-names">{event?.coupleNames || 'የሙሽሮች ስም'}</h1>

            {event?.verse && (
              <div className="print-verse">
                <p>"{event.verse}"</p>
              </div>
            )}

            <div className="print-invitation-body">
              <p>
                ክቡር/ክብርት <strong>{invitation.primaryContactName}</strong>
              </p>
              <p className="print-invitation-text">
                በልዑል እግዚአብሔር ፈቃድ የጋብቻ በዓላችንን ስናከብር በእለቱ ተገኝተው የደስታችን ተካፋይ እንዲሆኑ በታላቅ ክብርና ፍቅር ጋብዘንዎታል።
              </p>
            </div>

            {/* Side-by-Side Ethiopian & Gregorian Date Details */}
            <div className="print-event-details-box">
              <div className="print-calendars-container">
                {/* Ethiopian Calendar Card */}
                <div className="print-cal-column print-cal-ethio">
                  <div className="print-cal-badge">
                    <span className="print-cal-flag">🇪🇹</span>
                    <span className="print-cal-header-title">የኢትዮጵያ አቆጣጠር</span>
                  </div>
                  <div className="print-cal-main-date">{sideBySide.ethiopianFull}</div>
                  {sideBySide.timeFormatted && (
                    <div className="print-cal-time-text">{sideBySide.timeFormatted} ሰዓት</div>
                  )}
                </div>

                <div className="print-cal-separator" />

                {/* Gregorian Calendar Card */}
                <div className="print-cal-column print-cal-greg">
                  <div className="print-cal-badge">
                    <Globe size={13} className="print-cal-flag-icon" />
                    <span className="print-cal-header-title">Gregorian Calendar</span>
                  </div>
                  <div className="print-cal-main-date">{sideBySide.gregorianFull}</div>
                  {gregorianTime && (
                    <div className="print-cal-time-text">{gregorianTime} ({event?.timezone || 'UTC'})</div>
                  )}
                </div>
              </div>

              {/* Venue Row */}
              <div className="print-venue-row">
                <div className="print-detail-item print-detail-venue">
                  <MapPin size={18} className="print-detail-icon" />
                  <div>
                    <div className="print-detail-label">የሰርጉ አዳራሽ / ቦታ (Venue & Location)</div>
                    <div className="print-detail-value">{event?.venue || 'አዳራሽ'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="print-footer-tagline">
              « እግዚአብሔር ያጣመረውን ማንም አይለየውም »
            </div>
          </div>
        </div>

        {/* =========================================================
            BACK SIDE: ENTRANCE QR PASS & SECURITY SCAN (የኋላ ገጽ)
        ========================================================= */}
        <div className="print-card-sheet print-card-back">
          <div className="print-card-border">
            <div className="print-corner top-left">❦</div>
            <div className="print-corner top-right">❦</div>
            <div className="print-corner bottom-left">❦</div>
            <div className="print-corner bottom-right">❦</div>

            <div className="print-back-header">
              <div className="print-gold-badge">የመግቢያ ዲጂታል ፈቃድ (Digital Pass)</div>
              <h2 className="print-back-title">የመግቢያ ፈጣን QR ካርድ</h2>
              <p className="print-back-subtitle">
                እባክዎ በሰርጉ መግቢያ በር ላይ ይህንን QR ኮድ ለበር አስተናጋጆች ያሳዩ
              </p>
            </div>

            <div className="print-qr-grid">
              {guests.length > 0 ? (
                guests.map((guest, idx) => (
                  <div key={guest.id || idx} className="print-qr-card">
                    <div className="print-qr-guest-name">
                      {guest.fullName || invitation.primaryContactName}
                    </div>

                    <div className="print-qr-image-wrapper">
                      <QRCodeSVG
                        value={guest.guestQrToken || invitation.inviteLinkToken}
                        size={140}
                        level="H"
                        includeMargin={false}
                      />
                    </div>

                    <div className="print-qr-meta">
                      {guest.tableNumber ? (
                        <span className="print-table-tag">ጠረጴዛ ቁጥር: {guest.tableNumber}</span>
                      ) : (
                        <span className="print-table-tag">አጠቃላይ መቀመጫ</span>
                      )}
                      {guest.relationshipGroup && (
                        <span className="print-group-tag">{guest.relationshipGroup}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="print-qr-card">
                  <div className="print-qr-guest-name">{invitation.primaryContactName}</div>
                  <div className="print-qr-image-wrapper">
                    <QRCodeSVG
                      value={invitation.inviteLinkToken}
                      size={140}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <div className="print-qr-meta">
                    <span className="print-table-tag">የተጋባዥ ቁጥር: {invitation.partySizeAllowed || 1}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="print-scan-instruction">
              <QrCode size={20} />
              <span>ይህ ካርድ የመግቢያ ፈቃድዎ ስለሆነ እባክዎ ይዘውት ይምጡ</span>
            </div>

            <div className="print-footer-info">
              <div>የግብዣ መለያ: <code style={{ fontSize: '0.75rem' }}>{invitation.id.slice(0, 13)}</code></div>
              <div>አዘጋጅ: {event?.coupleNames}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
