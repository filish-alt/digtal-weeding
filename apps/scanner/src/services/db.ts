import { Guest, QueuedCheckin } from '../types';

const GUEST_CACHE_KEY = 'scanner_guest_cache';
const QUEUE_KEY = 'scanner_checkin_queue';

export const saveGuestCache = (guests: Guest[]) => {
  try {
    const minimalCache = guests.map((g) => ({
      id: g.id,
      fullName: g.fullName,
      isAttending: g.isAttending,
      guestQrToken: g.guestQrToken,
    }));
    localStorage.setItem(GUEST_CACHE_KEY, JSON.stringify(minimalCache));
  } catch (e) {
    console.error('Failed to cache guests locally', e);
  }
};

export const getGuestCache = (): Partial<Guest>[] => {
  try {
    const raw = localStorage.getItem(GUEST_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getQueuedCheckins = (): QueuedCheckin[] => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const enqueueCheckin = (guestQrToken: string, stationId?: string): QueuedCheckin => {
  const queue = getQueuedCheckins();
  const newItem: QueuedCheckin = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    guestQrToken,
    stationId,
    timestamp: new Date().toISOString(),
  };
  queue.push(newItem);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return newItem;
};

export const removeFromQueue = (id: string) => {
  const queue = getQueuedCheckins().filter((item) => item.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const processOfflineQueue = async (
  token: string,
  onProcessed?: (count: number) => void,
) => {
  const queue = getQueuedCheckins();
  if (queue.length === 0) return;

  let successCount = 0;
  for (const item of queue) {
    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          guestQrToken: item.guestQrToken,
          stationId: item.stationId,
        }),
      });

      if (res.ok || res.status === 409) {
        // Successfully sent or already checked in -> remove from queue
        removeFromQueue(item.id);
        successCount++;
      }
    } catch {
      // Network still offline -> stop batch
      break;
    }
  }

  if (successCount > 0 && onProcessed) {
    onProcessed(successCount);
  }
};
