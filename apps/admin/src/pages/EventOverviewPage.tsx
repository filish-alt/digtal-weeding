import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Event } from '../types';
import { Calendar, MapPin, Globe, Heart, Plus, Edit2, Check } from 'lucide-react';
import { getAssetUrl } from '../utils/api';

interface EventOverviewPageProps {
  currentEvent: Event | null;
  onEventSelected: (event: Event) => void;
}

export const EventOverviewPage: React.FC<EventOverviewPageProps> = ({
  currentEvent,
  onEventSelected,
}) => {
  const { fetchWithAuth } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Form fields
  const [slug, setSlug] = useState('');
  const [coupleNames, setCoupleNames] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [venue, setVenue] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  // New fields
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [verse, setVerse] = useState<string>('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/events');
      if (res.ok) {
        const data: Event[] = await res.json();
        setEvents(data);
        if (data.length > 0 && !currentEvent) {
          onEventSelected(data[0]);
          populateForm(data[0]);
        } else if (currentEvent) {
          populateForm(currentEvent);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (evt: Event) => {
    setSlug(evt.slug);
    setCoupleNames(evt.coupleNames);
    setEventDate(
      evt.eventDate ? new Date(evt.eventDate).toISOString().slice(0, 16) : '',
    );
    setVenue(evt.venue);
    setTimezone(evt.timezone || 'UTC');
    setPhotoUrl(evt.photoUrl || '');
    setVerse(evt.verse || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // If a new photo file is selected, upload it first
      let uploadedUrl = photoUrl;
      if (photoFile) {
        const fd = new FormData();
        fd.append('file', photoFile);
        const uploadRes = await fetchWithAuth('/api/upload', {
          method: 'POST',
          body: fd,
        });
        if (!uploadRes.ok) throw new Error('Photo upload failed');
        const data = await uploadRes.json();
        uploadedUrl = data.url;
      }

      const payload = {
        slug,
        coupleNames,
        eventDate: new Date(eventDate).toISOString(),
        venue,
        timezone,
        photoUrl: uploadedUrl,
        verse,
      };

      if (currentEvent) {
        // Update
        const res = await fetchWithAuth(`/api/events/${currentEvent.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated: Event = await res.json();
          onEventSelected(updated);
          setEditing(false);
        }
      } else {
        // Create
        const res = await fetchWithAuth('/api/events', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created: Event = await res.json();
          onEventSelected(created);
          setEvents((prev) => [created, ...prev]);
          setEditing(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading event details...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Event Overview</h1>
          <p className="page-subtitle">
            Manage your wedding event details and configuration
          </p>
        </div>

        {events.length > 0 && !editing && (
          <button
            className="btn btn-outline"
            onClick={() => {
              if (currentEvent) populateForm(currentEvent);
              setEditing(true);
            }}
          >
            <Edit2 size={16} /> Edit Details
          </button>
        )}
      </div>

      {events.length > 0 && (
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          {events.map((evt) => (
            <button
              key={evt.id}
              onClick={() => {
                onEventSelected(evt);
                populateForm(evt);
                setEditing(false);
              }}
              className={`btn ${
                currentEvent?.id === evt.id ? 'btn-primary' : 'btn-outline'
              }`}
            >
              <Heart size={16} /> {evt.coupleNames}
            </button>
          ))}
        </div>
      )}

      {(!currentEvent || editing) ? (
        <div className="card" style={{ maxWidth: '640px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
            {currentEvent ? 'Edit Event Details' : 'Create New Event'}
          </h2>
          <form onSubmit={handleSave}>
            {!currentEvent && (
              <div className="form-group">
                <label className="form-label">Event Slug (URL identifier)</label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="alice-bob-2026"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
            )}
            {/* Photo upload */}
            <div className="form-group">
              <label className="form-label">Event Photo (max 5 MiB)</label>
              <input
                type="file"
                accept="image/*"
                className="input-text"
                onChange={e => setPhotoFile(e.target.files?.[0] ?? null)}
              />
              {photoUrl && (
                <img src={getAssetUrl(photoUrl)} alt="Preview" style={{ marginTop: '8px', maxWidth: '100%', borderRadius: '4px' }} />
              )}
            </div>
            {/* Optional verse */}
            <div className="form-group">
              <label className="form-label">Optional Verse (max 1000 chars)</label>
              <textarea
                className="input-text"
                placeholder="Your beautiful verse..."
                maxLength={1000}
                rows={3}
                value={verse}
                onChange={e => setVerse(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Couple Names</label>
              <input
                type="text"
                className="input-text"
                placeholder="Alice & Bob"
                value={coupleNames}
                onChange={(e) => setCoupleNames(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Event Date & Time</label>
              <input
                type="datetime-local"
                className="input-text"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Venue Location</label>
              <input
                type="text"
                className="input-text"
                placeholder="Grand Ballroom Hotel, New York"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select
                className="input-text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary">
                <Check size={16} /> Save Event
              </button>
              {currentEvent && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  padding: '16px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                }}
              >
                <Heart size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                  {currentEvent.coupleNames}
                </h2>
                <span className="badge badge-neutral">Slug: {currentEvent.slug}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Calendar style={{ color: 'var(--primary)' }} size={20} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DATE & TIME</div>
                  <div style={{ fontWeight: 600 }}>
                    {new Date(currentEvent.eventDate).toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MapPin style={{ color: 'var(--primary)' }} size={20} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>VENUE</div>
                  <div style={{ fontWeight: 600 }}>{currentEvent.venue}</div>
                </div>
              </div>
              {/* Photo preview */}
              {currentEvent.photoUrl && (
                <div style={{ marginTop: '12px' }}>
                  <img src={getAssetUrl(currentEvent.photoUrl)} alt="Event" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                </div>
              )}
              {/* Verse */}
              {currentEvent.verse && (
                <div style={{ marginTop: '12px' }}>
                  <blockquote style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>{currentEvent.verse}</blockquote>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Globe style={{ color: 'var(--primary)' }} size={20} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TIMEZONE</div>
                  <div style={{ fontWeight: 600 }}>{currentEvent.timezone}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
