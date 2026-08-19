import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'am';

export interface Translations {
  // Top bar & general
  lightView: string;
  darkView: string;
  languageName: string;
  loadingInvitation: string;
  notice: string;
  invalidLink: string;

  // Header & Event
  weddingInvitation: string;
  dearGuest: string;
  invitationWelcome: string;
  date: string;
  ethiopianCalendar: string;
  gregorianCalendar: string;
  ethiopianDate: string;
  gregorianDate: string;
  venue: string;
  timezone: string;

  // RSVP Form
  householdRsvp: string;
  maxAllowed: string;
  capExceededNotice: string;
  joyfullyAccepts: string;
  regretfullyDeclines: string;
  confirmRsvp: string;
  submittingRsvp: string;

  // Confirmation & Pass
  rsvpConfirmedTitle: string;
  rsvpConfirmedSubtitle: string;
  digitalPassTitle: string;
  digitalPassSubtitle: string;
  tableNumber: string;
  tableNotAssigned: string;
  attending: string;
  declined: string;
  scanNotice: string;
  editRsvp: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    lightView: 'Light View',
    darkView: 'Dark View',
    languageName: 'English',
    loadingInvitation: 'Loading your wedding invitation...',
    notice: 'Notice',
    invalidLink: 'Invalid invite link. Please check your invitation URL.',

    weddingInvitation: 'Wedding Invitation',
    dearGuest: 'Dear',
    invitationWelcome: 'cordially invite you to celebrate their special wedding day',
    date: 'Date & Time',
    ethiopianCalendar: 'Ethiopian Calendar',
    gregorianCalendar: 'Gregorian Calendar',
    ethiopianDate: 'Ethiopian Date',
    gregorianDate: 'Gregorian Date',
    venue: 'Venue & Location',
    timezone: 'Timezone',

    householdRsvp: 'Household RSVP',
    maxAllowed: 'Maximum allowed attending guests:',
    capExceededNotice: 'You have selected more attending guests than your allowed party limit.',
    joyfullyAccepts: 'Joyfully Accepts',
    regretfullyDeclines: 'Regretfully Declines',
    confirmRsvp: 'Confirm RSVP Response',
    submittingRsvp: 'Submitting RSVP...',

    rsvpConfirmedTitle: 'RSVP Received With Joy!',
    rsvpConfirmedSubtitle: 'Your response has been saved. Present your digital entrance passes at the venue.',
    digitalPassTitle: 'Digital Entrance Pass',
    digitalPassSubtitle: 'Each attending guest has a personalized secure QR code for swift check-in.',
    tableNumber: 'Table',
    tableNotAssigned: 'To be assigned',
    attending: 'Attending',
    declined: 'Declined',
    scanNotice: 'Show this QR pass at the entrance on wedding day',
    editRsvp: 'Update RSVP Response',
  },
  am: {
    lightView: 'ነጭ ገጽታ',
    darkView: 'ጨለማ ገጽታ',
    languageName: 'አማርኛ',
    loadingInvitation: 'የሰርግ ግብዣዎ በመጫን ላይ ነው...',
    notice: 'ማሳሰቢያ',
    invalidLink: 'ልክ ያልሆነ የግብዣ ማስፈንጠሪያ። እባክዎ የግብዣ አድራሻዎን ያረጋግጡ።',

    weddingInvitation: 'የሰርግ ጥሪ ግብዣ',
    dearGuest: 'ክቡር/ክብርት',
    invitationWelcome: 'በጋብቻ በዓላቸው ላይ አብረዋቸው እንዲደሰቱ በታላቅ አክብሮት ጋብዘውዎታል',
    date: 'ቀን እና ሰዓት',
    ethiopianCalendar: 'የኢትዮጵያ አቆጣጠር',
    gregorianCalendar: 'የፈረንጆች አቆጣጠር',
    ethiopianDate: 'የኢትዮጵያ ቀን',
    gregorianDate: 'የፈረንጆች ቀን',
    venue: 'የሰርጉ አዳራሽ / ቦታ',
    timezone: 'የሰዓት አቆጣጠር',

    householdRsvp: 'የተጋባዦች መገኘት ማረጋገጫ (RSVP)',
    maxAllowed: 'የተፈቀደው ከፍተኛ የተጋባዥ ቁጥር:',
    capExceededNotice: 'ከተፈቀደልዎ የተጋባዥ ቁጥር በላይ መርጠዋል። እባክዎ ምርጫዎን ያስተካክሉ።',
    joyfullyAccepts: 'በደስታ እገኛለሁ',
    regretfullyDeclines: 'ይቅርታ አልገኝም',
    confirmRsvp: 'ምላሽህን አረጋግጥ',
    submittingRsvp: 'በማረጋገጥ ላይ...',

    rsvpConfirmedTitle: 'ምላሽዎ በደስታ ተቀባይነት አግኝቷል!',
    rsvpConfirmedSubtitle: 'ምላሽዎ በተሳካ ሁኔታ ተመዝግቧል። በሰርጉ ዕለት ይህንን የዲጂታል መግቢያ ካርድ ያሳዩ።',
    digitalPassTitle: 'የዲጂታል መግቢያ ካርድ',
    digitalPassSubtitle: 'እያንዳንዱ ተጋባዥ ፈጣን መግቢያ የሚያስችል የግል የQR ኮድ አለው።',
    tableNumber: 'ጠረጴዛ ቁጥር',
    tableNotAssigned: 'በቅርቡ ይመደባል',
    attending: 'ይገኛሉ',
    declined: 'አይገኙም',
    scanNotice: 'ይህን የQR ኮድ በሰርጉ መግቢያ በር ላይ ያሳዩ',
    editRsvp: 'የመገኘት ምላሽህን አሻሽል',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('wedding_guest_lang');
    return saved === 'am' ? 'am' : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('wedding_guest_lang', lang);
    document.documentElement.setAttribute('lang', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'am' : 'en');
  };

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
