import React, { useState } from 'react';
import { Users, Check, X, AlertCircle } from 'lucide-react';
import { Guest } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface RsvpFormProps {
  guests: Guest[];
  partySizeAllowed?: number | null;
  onSubmit: (responses: { guestId: string; isAttending: boolean }[]) => Promise<void>;
  isSubmitting: boolean;
}

export const RsvpForm: React.FC<RsvpFormProps> = ({
  guests,
  partySizeAllowed,
  onSubmit,
  isSubmitting,
}) => {
  const { t } = useLanguage();

  // Store guest responses state: Map guestId -> boolean
  const [responses, setResponses] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    guests.forEach((g) => {
      // Default to true if already confirmed attending, or default true
      initial[g.id] = g.isAttending ?? true;
    });
    return initial;
  });

  const handleToggle = (guestId: string, isAttending: boolean) => {
    setResponses((prev) => ({
      ...prev,
      [guestId]: isAttending,
    }));
  };

  const attendingCount = Object.values(responses).filter(Boolean).length;
  const isCapExceeded =
    partySizeAllowed !== null &&
    partySizeAllowed !== undefined &&
    attendingCount > partySizeAllowed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCapExceeded) return;

    const payload = Object.entries(responses).map(([guestId, isAttending]) => ({
      guestId,
      isAttending,
    }));

    await onSubmit(payload);
  };

  return (
    <section className="info-card">
      <h2 className="section-title">
        <Users className="icon" size={24} /> {t.householdRsvp}
      </h2>

      {partySizeAllowed !== null && partySizeAllowed !== undefined && (
        <div className="cap-badge">
          <Users size={16} /> {t.maxAllowed} {partySizeAllowed}
        </div>
      )}

      {isCapExceeded && (
        <div className="alert-error">
          <AlertCircle size={20} />
          <span>{t.capExceededNotice}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="guest-list">
          {guests.map((guest) => {
            const isAttending = responses[guest.id] ?? false;

            return (
              <div key={guest.id} className="guest-card">
                <div className="guest-card-header">
                  <span className="guest-name">{guest.fullName}</span>
                  {guest.relationshipGroup && (
                    <span className="guest-group">{guest.relationshipGroup}</span>
                  )}
                </div>

                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-btn ${isAttending ? 'active-yes' : ''}`}
                    onClick={() => handleToggle(guest.id, true)}
                  >
                    <Check size={18} /> {t.joyfullyAccepts}
                  </button>

                  <button
                    type="button"
                    className={`toggle-btn ${!isAttending ? 'active-no' : ''}`}
                    onClick={() => handleToggle(guest.id, false)}
                  >
                    <X size={18} /> {t.regretfullyDeclines}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting || isCapExceeded || guests.length === 0}
        >
          {isSubmitting ? t.submittingRsvp : t.confirmRsvp}
        </button>
      </form>
    </section>
  );
};
