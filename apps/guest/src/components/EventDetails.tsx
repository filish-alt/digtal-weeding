import React from 'react';
import { Calendar, MapPin, Clock, Globe } from 'lucide-react';
import { Event } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatSideBySideDates } from '../utils/ethiopianDate';

interface EventDetailsProps {
  event?: Partial<Event>;
}

export const EventDetails: React.FC<EventDetailsProps> = ({ event }) => {
  const { language, t } = useLanguage();
  if (!event) return null;

  const sideBySide = formatSideBySideDates(event.eventDate, language);
  const eventDateObj = event.eventDate ? new Date(event.eventDate) : null;
  const gregorianTime = eventDateObj
    ? eventDateObj.toLocaleTimeString(language === 'am' ? 'am-ET' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const encodedVenue = encodeURIComponent(event.venue || 'Wedding Venue');
  const googleMapUrl = `https://maps.google.com/maps?q=${encodedVenue}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <section className="info-card">
      <h2 className="section-title">
        <Calendar className="icon" size={24} /> {language === 'am' ? 'የሰርጉ መረጃ' : 'Event Details'}
      </h2>

      {/* Side by Side Ethiopian & Gregorian Calendars */}
      <div className="calendars-side-by-side-grid">
        {/* Ethiopian Calendar */}
        <div className="cal-card-item cal-card-ethiopian">
          <div className="cal-card-header">
            <span className="cal-flag">🇪🇹</span>
            <span className="cal-header-label">{t.ethiopianCalendar}</span>
          </div>
          <div className="cal-card-date">{sideBySide.ethiopianFull}</div>
          {sideBySide.timeFormatted && (
            <div className="cal-card-time">
              <Clock size={15} />
              <span>{sideBySide.timeFormatted} ሰዓት</span>
            </div>
          )}
        </div>

        {/* Gregorian Calendar */}
        <div className="cal-card-item cal-card-gregorian">
          <div className="cal-card-header">
            <Globe size={15} className="cal-header-icon" />
            <span className="cal-header-label">{t.gregorianCalendar}</span>
          </div>
          <div className="cal-card-date">{sideBySide.gregorianFull}</div>
          {gregorianTime && (
            <div className="cal-card-time">
              <Clock size={15} />
              <span>
                {gregorianTime} ({event.timezone || 'UTC'})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Venue Section */}
      <div className="venue-detail-box">
        <div className="info-item">
          <MapPin className="info-icon" size={20} />
          <div>
            <div className="info-label">{t.venue}</div>
            <div className="info-value">{event.venue || 'አዳራሽ'}</div>
          </div>
        </div>
      </div>

      {event.venue && (
        <div className="map-container">
          <iframe
            title="Venue Location Map"
            src={googleMapUrl}
            loading="lazy"
            allowFullScreen
          />
        </div>
      )}
    </section>
  );
};

