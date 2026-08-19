export type {
  StaffLoginPayload,
  StaffLoginResponse,
  CheckinPayload,
  CheckinResponse,
  Guest,
} from '@digital-wedding/shared-types';

export interface QueuedCheckin {
  id: string;
  guestQrToken: string;
  stationId?: string;
  timestamp: string;
}
