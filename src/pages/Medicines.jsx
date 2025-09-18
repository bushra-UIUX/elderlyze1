import React, { useEffect, useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import '../Assets/Css/Medicine.css';
import { 
  collection, addDoc, doc, updateDoc, deleteDoc,
  onSnapshot, query, where, serverTimestamp 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {generateMessagingToken, auth, db,messaging } from "../Firebase/firebase";
import { onMessage } from "firebase/messaging";

// Firestore-backed CRUD; localStorage no longer used

function emptyForm() {
  return {
    id: '',
    name: '',
    schedule: '',
    mealTiming: 'before',
    timesPerDay: 1,
    times: [],
    alertsEnabled: true,
    startDate: '',
    endDate: '',
  };
}

function Medicines() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [inAppNotification, setInAppNotification] = useState(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user ? user.uid : '');
    });
    
    // Handle foreground messages with enhanced UI
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Show a custom in-app notification
      showInAppNotification(payload);
    }); 
    
    return () => {
      unsubAuth();
      unsubscribe();
    };
   
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = queryCollectionForUser(currentUserId);
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(rows);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUserId]);

  // Generate and persist FCM token only after the user is authenticated
  useEffect(() => {
    if (!currentUserId) return;
    generateMessagingToken();
  }, [currentUserId]);

  function queryCollectionForUser(userId) {
    // Keep it simple to avoid composite index requirement
    return query(collection(db, 'medicines'), where('userId', '==', userId));
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((m) => `${m.name} ${m.schedule}`.toLowerCase().includes(q));
  }, [items, search]);

  function startAdd() {
    setForm({ ...emptyForm(), id: '' }); // ✅ force empty ID on add
    setShowForm(true);
  }

  function startEdit(id) {
    const current = items.find((m) => m.id === id);
    if (!current) return;
    setForm({
      ...current,
      times: Array.isArray(current.times) ? current.times : [],
      alertsEnabled: typeof current.alertsEnabled === 'boolean' ? current.alertsEnabled : true,
    });
    setShowForm(true);
  }

  async function remove(id) {
    try {
      if (!currentUserId || !id) return;
      await deleteDoc(doc(db, 'medicines', id));
    } catch (err) {
      console.error('Failed to delete medicine', err);
    }
  }

  async function toggleAlerts(id, enabled) {
    try {
      if (!currentUserId || !id) return;
      await updateDoc(doc(db, 'medicines', id), {
        alertsEnabled: enabled,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to toggle alerts', err);
    }
  }

  function showInAppNotification(payload) {
    const notification = {
      id: Date.now(),
      title: payload.notification?.title || 'Medicine Reminder',
      body: payload.notification?.body || 'Time to take your medicine!',
      medicineId: payload.data?.medicineId,
      time: payload.data?.time,
      zone: payload.data?.zone,
      timestamp: new Date(),
    };
    
    setInAppNotification(notification);
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
      setInAppNotification(null);
    }, 8000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!currentUserId) return;
    const normalizedTimes = (form.times || [])
      .slice(0, form.timesPerDay)
      .map((t) => String(t || '').trim())
      .filter(Boolean);

    // Capture user's IANA timezone for consistent cross-region scheduling
    const userTimeZone = DateTime.local().zoneName || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    const payload = {
      userId: currentUserId,
      name: form.name.trim(),
      schedule: form.schedule,
      mealTiming: form.mealTiming,
      timesPerDay: form.timesPerDay,
      times: normalizedTimes,
      startDate: form.startDate,
      endDate: form.endDate,
      alertsEnabled: !!form.alertsEnabled,
      timeZone: userTimeZone,
      updatedAt: serverTimestamp(),
    };

    const nextErrors = {};
    if (!payload.name) nextErrors.name = 'Name is required';
    if (payload.timesPerDay > 0 && normalizedTimes.length !== payload.timesPerDay) {
      nextErrors.times = `Please provide ${payload.timesPerDay} time${payload.timesPerDay > 1 ? 's' : ''}`;
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      const isExisting = form.id && items.some((m) => m.id === form.id);
      if (isExisting) {
        // ✅ Edit existing
        await updateDoc(doc(db, 'medicines', form.id), payload);
      } else {
        // ✅ Add new
        await addDoc(collection(db, 'medicines'), { ...payload, createdAt: serverTimestamp() });
      }
      setShowForm(false);
      setFieldErrors({});
    } catch (err) {
      console.error('Failed to save medicine', err);
    }
  }

  // Notification helpers (client-side fallback when app is open)
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      // Request permission quietly; the browser will prompt once
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  function hasFiredToday(key) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return false;
      const { lastFiredISO } = JSON.parse(stored);
      // Only once per date per medicine/time combo
      const last = DateTime.fromISO(lastFiredISO);
      const today = DateTime.now().toISODate();
      return last.toISODate() === today;
    } catch (_) {
      return false;
    }
  }

  function markFired(key) {
    try {
      localStorage.setItem(key, JSON.stringify({ lastFiredISO: DateTime.now().toISO() }));
    } catch (_) {
      // ignore storage errors
    }
  }

  useEffect(() => {
    // Lightweight scheduler: checks every 30s and triggers Notification API
    // Uses the medicine's stored IANA timezone for accurate cross-country times
    if (!items || items.length === 0) return;
    if (!('Notification' in window)) return;

    const interval = setInterval(() => {
      const now = DateTime.now();
      items.forEach((m) => {
        if (!m.alertsEnabled) return;
        const zone = m.timeZone || DateTime.local().zoneName || 'UTC';
        const startOk = !m.startDate || now.setZone(zone).toISODate() >= m.startDate;
        const endOk = !m.endDate || now.setZone(zone).toISODate() <= m.endDate;
        if (!startOk || !endOk) return;
        if (!Array.isArray(m.times)) return;

        m.times.forEach((t) => {
          if (!t) return;
          // Build today's occurrence in the medicine's timezone
          const todayLocal = now.setZone(zone).toISODate();
          const targetLocal = DateTime.fromISO(`${todayLocal}T${t}`, { zone: zone });
          // Allow a small window (±60s) to avoid missing by a second
          const diffSec = Math.abs(now.setZone(zone).diff(targetLocal, 'seconds').seconds);
          if (diffSec <= 60) {
            const key = `notify:${currentUserId}:${m.id}:${todayLocal}:${t}`;
            if (!hasFiredToday(key) && Notification.permission === 'granted') {
              try {
                new Notification('Medicine reminder', {
                  body: `${m.name || 'Medicine'} • ${t} (${zone})${m.mealTiming ? ` • ${m.mealTiming} meal` : ''}`,
                  tag: key,
                  icon: '/elderlyze-logo.png',
                });
                markFired(key);
              } catch (_) {
                // ignore
              }
            }
          }
        });
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [items, currentUserId]);

  return (
    <main className="meds">
      <div className="container">
        <div className="meds-header">
          <div>
            <h1 className="meds-title">Medicines</h1>
            <p className="meds-sub">Manage your current medications and schedules.</p>
          </div>
          <div className="meds-actions">
            <input
              className="meds-search"
              type="search"
              placeholder="Search medicines"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search medicines"
            />
            <button className="btn btn-primary" onClick={startAdd}>Add medicine</button>
          </div>
        </div>

        <div className="meds-list" role="list">
          {(!loading && filtered.length === 0) && (
            <div className="meds-empty">No medicines yet. Click "Add medicine" to create one.</div>
          )}
          {filtered.map((m) => (
            <article key={m.id} className="meds-item" role="listitem">
              <div className="meds-item-main">
                <div className="meds-name">{m.name || 'Untitled'}</div>
                <div className="meds-meta">
                  {m.schedule && <span className="pill">{m.schedule}</span>}
                  {m.mealTiming && <span className="pill">{m.mealTiming === 'before' ? 'Before meal' : 'After meal'}</span>}
                  {m.timesPerDay ? <span className="pill">{m.timesPerDay}x/day</span> : null}
                  {Array.isArray(m.times) && m.times.length > 0 && (
                    <span className="pill">{m.times.join(', ')}</span>
                  )}
                  {(m.startDate || m.endDate) && (
                    <span className="pill">{m.startDate || '—'} → {m.endDate || '—'}</span>
                  )}
                  <span className={`pill ${m.alertsEnabled ? 'pill-success' : 'pill-muted'}`}>
                    {m.alertsEnabled ? '🔔 Alerts ON' : '🔕 Alerts OFF'}
                  </span>
                </div>
              </div>
              <div className="meds-item-actions">
                <button 
                  className={`btn ${m.alertsEnabled ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => toggleAlerts(m.id, !m.alertsEnabled)}
                  title={m.alertsEnabled ? 'Alerts ON' : 'Alerts OFF'}
                >
                  {m.alertsEnabled ? '🔔' : '🔕'}
                </button>
                <button className="btn btn-ghost" onClick={() => startEdit(m.id)}>Edit</button>
                <button className="btn btn-secondary" onClick={() => remove(m.id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* In-App Notification */}
      {inAppNotification && (
        <div className="in-app-notification" role="alert">
          <div className="notification-content">
            <div className="notification-icon">🔔</div>
            <div className="notification-text">
              <div className="notification-title">{inAppNotification.title}</div>
              <div className="notification-body">{inAppNotification.body}</div>
              {inAppNotification.time && (
                <div className="notification-meta">
                  Time: {inAppNotification.time} ({inAppNotification.zone})
                </div>
              )}
            </div>
            <button 
              className="notification-close"
              onClick={() => setInAppNotification(null)}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="meds-modal" role="dialog" aria-modal="true">
          <div className="meds-modal-card">
            <div className="meds-modal-head">
              <h2>{items.some((x) => x.id === form.id) ? 'Edit medicine' : 'Add medicine'}</h2>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Close</button>
            </div>
            <form className="meds-form" onSubmit={handleSubmit}>
              <label>
                Name
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required aria-invalid={!!fieldErrors.name} />
                {fieldErrors.name && <div className="error-text" role="alert">{fieldErrors.name}</div>}
              </label>
              
              <label>
                Schedule
                <input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="e.g., twice daily" />
              </label>
              <label>
                Meal timing
                <select value={form.mealTiming} onChange={(e) => setForm({ ...form, mealTiming: e.target.value })}>
                  <option value="before">Before meal</option>
                  <option value="after">After meal</option>
                </select>
              </label>
              <label>
                Times per day
                <select value={form.timesPerDay} onChange={(e) => {
                  const next = Number(e.target.value);
                  let nextTimes = Array.isArray(form.times) ? [...form.times] : [];
                  if (next > nextTimes.length) {
                    nextTimes = nextTimes.concat(Array(next - nextTimes.length).fill(''));
                  } else if (next < nextTimes.length) {
                    nextTimes = nextTimes.slice(0, next);
                  }
                  setForm({ ...form, timesPerDay: next, times: nextTimes });
                }}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </label>
              {Array.from({ length: form.timesPerDay || 0 }).map((_, idx) => (
                <label key={idx}>
                  Time #{idx + 1}
                  <input 
                    type="time" 
                    value={(form.times && form.times[idx]) || ''} 
                    onChange={(e) => {
                      const next = Array.isArray(form.times) ? [...form.times] : [];
                      next[idx] = e.target.value;
                      setForm({ ...form, times: next });
                    }}
                    required
                  />
                </label>
              ))}
              {fieldErrors.times && <div className="error-text" role="alert">{fieldErrors.times}</div>}
              <label>
                Start date
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </label>
              <label>
                End date
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </label>
              <label className="switch-row">
                <div className="switch-label">
                  <span>🔔 Medicine Reminders</span>
                  <span className="switch-description">Receive push notifications at scheduled times</span>
                </div>
                <div className="switch-container">
                  <input 
                    type="checkbox" 
                    checked={!!form.alertsEnabled} 
                    onChange={(e) => setForm({ ...form, alertsEnabled: e.target.checked })} 
                  />
                  <span className="switch-status">
                    {form.alertsEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              </label>
              
              <div className="meds-form-actions">
                <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default Medicines;
