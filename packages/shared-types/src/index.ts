// ─── Domain Models ──────────────────────────────────────────

export interface Tenant {
  id: string;
  ownerEmail: string;
  ownerName: string;
  createdAt: string | Date;
}

export interface Event {
  id: string;
  tenantId: string;
  slug: string;
  coupleNames: string;
  eventDate: string | Date;
  venue: string;
  timezone: string;
  createdAt: string | Date;
  photoUrl?: string | null;
  verse?: string | null;
}

export interface Invitation {
  id: string;
  eventId: string;
  primaryContactName: string;
  phone?: string | null;
  deliveryChannel?: string | null;
  inviteLinkToken: string;
  partySizeAllowed?: number | null;
  partySizeConfirmed?: number;
  createdAt: string | Date;
  event?: Partial<Event>;
  guests?: Guest[];
}

export interface Guest {
  id: string;
  invitationId: string;
  fullName: string;
  relationshipGroup?: string | null;
  needsPhysicalCard: boolean;
  isAttending?: boolean | null;
  respondedAt?: string | Date | null;
  guestQrToken: string;
  tableNumber?: number | null;
  createdAt: string | Date;
  invitation?: Partial<Invitation>;
  checkin?: Checkin | null;
}

export interface Checkin {
  id: string;
  guestId: string;
  checkedInAt: string | Date;
  checkedInBy?: string | null;
  stationId?: string | null;
  guest?: Partial<Guest>;
}

export interface StaffAccount {
  id: string;
  eventId: string;
  name: string;
  stationId?: string | null;
  tokenExpiresAt?: string | Date | null;
  createdAt: string | Date;
}

// ─── DTO Payload & Response Shapes ──────────────────────────

export interface RsvpGuestItem {
  guestId: string;
  isAttending: boolean;
}

export interface SubmitRsvpPayload {
  rsvp: RsvpGuestItem[];
}

export interface CreateGuestPayload {
  fullName: string;
  relationshipGroup?: string;
  needsPhysicalCard?: boolean;
  tableNumber?: number;
}

export interface UpdateGuestPayload {
  fullName?: string;
  relationshipGroup?: string;
  needsPhysicalCard?: boolean;
  tableNumber?: number;
}

export interface CreateStaffPayload {
  name: string;
  pinCode: string;
  stationId?: string;
  tokenExpiresAt?: string;
}

export interface StaffLoginPayload {
  stationId: string;
  pinCode: string;
}

export interface StaffLoginResponse {
  access_token: string;
  staffAccount: {
    id: string;
    name: string;
    eventId: string;
    stationId: string;
  };
}

export interface CheckinPayload {
  guestQrToken: string;
  stationId?: string;
}

export interface CheckinResponse {
  checkin: Checkin;
  wasRsvpd: boolean;
  warning?: string;
}

export interface LiveCheckinStats {
  checkins: Checkin[];
  stats: {
    totalCheckedIn: number;
    totalConfirmedGuests: number;
    totalGuests: number;
    checkinRate: string;
  };
}
