import React from 'react';
import { Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  coupleNames?: string;
  primaryContactName?: string;
  photoUrl?: string | null;
  verse?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  coupleNames = 'The Wedding Celebration',
  primaryContactName,
  photoUrl,
  verse,
}) => {
  const { t } = useLanguage();

  return (
    <header className="hero-card">
      {photoUrl && (
        <div className="hero-photo-wrapper">
          <img src={photoUrl} alt={coupleNames} className="hero-photo" />
        </div>
      )}
      <div className="monogram">
        <Heart size={24} />
      </div>
      <div className="invitation-subtitle">{t.weddingInvitation}</div>
      <h1 className="couple-names">{coupleNames}</h1>
      {verse && (
        <div className="hero-verse">
          <p>{verse}</p>
        </div>
      )}
      {primaryContactName && (
        <div className="contact-greeting">
          {t.dearGuest} {primaryContactName}, {t.invitationWelcome}
        </div>
      )}
    </header>
  );
};
