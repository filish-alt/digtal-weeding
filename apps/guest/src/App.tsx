import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { EventDetails } from './components/EventDetails';
import { RsvpForm } from './components/RsvpForm';
import { ConfirmationView } from './components/ConfirmationView';
import { PhysicalCardView } from './components/PhysicalCardView';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Invitation } from './types';
import { AlertCircle, Sun, Moon, Globe, Printer, LayoutTemplate } from 'lucide-react';
import { getApiUrl } from './utils/api';

const GuestAppContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [token, setToken] = useState<string>('');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showPhysicalCard, setShowPhysicalCard] = useState<boolean>(false);

  useEffect(() => {
    // Extract token from URL path: /invite/:token or query param ?token=...
    const pathname = window.location.pathname;
    const match = pathname.match(/\/invite\/([^/]+)/);
    const urlToken = match ? match[1] : new URLSearchParams(window.location.search).get('token');

    if (!urlToken) {
      setError(t.invalidLink);
      setLoading(false);
      return;
    }

    setToken(urlToken);
    fetchInvitation(urlToken);
  }, []);

  const fetchInvitation = async (inviteToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl(`/api/rsvp/${inviteToken}`));
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(t.invalidLink);
        }
        throw new Error('Unable to load invitation. Please try again later.');
      }
      const data: Invitation = await res.json();
      setInvitation(data);

      // If channel is physical, automatically default to physical printable card
      if (data.deliveryChannel?.toLowerCase() === 'physical' || data.deliveryChannel === 'card') {
        setShowPhysicalCard(true);
      }

      // If guests have already responded on digital channel, default to confirmation view
      const hasResponded = data.guests?.some((g) => g.respondedAt !== null && g.respondedAt !== undefined);
      if (hasResponded) {
        setIsSubmitted(true);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRsvp = async (
    responses: { guestId: string; isAttending: boolean }[],
  ) => {
    if (!token) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(getApiUrl(`/api/rsvp/${token}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rsvp: responses }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit RSVP.');
      }

      const updatedInvitation: Invitation = await res.json();
      setInvitation(updatedInvitation);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit RSVP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="guest-app">
        <div className="state-container">
          <div className="spinner" />
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
            {t.loadingInvitation}
          </p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="guest-app">
        <div className="hero-card">
          <div className="monogram" style={{ color: 'var(--error-color)', backgroundColor: 'var(--error-bg)' }}>
            <AlertCircle size={32} />
          </div>
          <h1 className="couple-names" style={{ fontSize: '1.8rem' }}>{t.notice}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!invitation) return null;

  const isPhysicalChannel = invitation.deliveryChannel?.toLowerCase() === 'physical' || invitation.deliveryChannel === 'card';

  return (
    <div className="guest-app">
      {/* Floating Top Controls Bar (Language Switcher, Card Format Switcher & Theme Toggle) */}
      <div className="guest-top-bar no-print" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {/* Toggle between Digital Portal and Physical Printable Card */}
        <button
          type="button"
          className="guest-theme-toggle"
          onClick={() => setShowPhysicalCard(!showPhysicalCard)}
          title="Switch Card Layout"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          {showPhysicalCard ? <LayoutTemplate size={16} /> : <Printer size={16} />}
          <span>
            {showPhysicalCard
              ? (language === 'am' ? 'ዲጂታል ገጽታ' : 'Digital Portal')
              : (language === 'am' ? '🖨️ የሚታተም ካርድ' : '🖨️ Printable Card')}
          </span>
        </button>

        <button
          type="button"
          className="guest-theme-toggle"
          onClick={toggleLanguage}
          title="Switch Language / ቋንቋ ቀይር"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Globe size={16} />
          <span style={{ fontWeight: 800 }}>{language === 'en' ? '🇪🇹 አማርኛ' : '🇺🇸 English'}</span>
        </button>

        <button
          type="button"
          className="guest-theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          <span>{theme === 'dark' ? t.lightView : t.darkView}</span>
        </button>
      </div>

      {/* PHYSICAL PRINTABLE CARD VIEW */}
      {showPhysicalCard ? (
        <PhysicalCardView invitation={invitation} />
      ) : (
        /* DIGITAL RSVP VIEW */
        <>
          <div className="invitation-top-grid">
            <Header
              coupleNames={invitation.event?.coupleNames}
              primaryContactName={invitation.primaryContactName}
              photoUrl={invitation.event?.photoUrl}
              verse={invitation.event?.verse}
            />
            <EventDetails event={invitation.event} />
          </div>

          {isSubmitted ? (
            <ConfirmationView
              guests={invitation.guests || []}
              onEditRsvp={() => setIsSubmitted(false)}
            />
          ) : (
            <>
              {error && (
                <div className="alert-error">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              <RsvpForm
                guests={invitation.guests || []}
                partySizeAllowed={invitation.partySizeAllowed}
                onSubmit={handleSubmitRsvp}
                isSubmitting={isSubmitting}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <GuestAppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
};
