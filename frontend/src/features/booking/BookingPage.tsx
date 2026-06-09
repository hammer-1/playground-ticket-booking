import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../../components/Toast';
import { ApiError, api } from '../../lib/api';
import type { Slot } from '../../lib/types';
import { usePitches } from './usePitches';
import { useSlots } from './useSlots';
import { upcomingDays } from './dates';
import { SlotCell } from './SlotCell';
import { ReservationBar } from './ReservationBar';

interface Hold {
  // The hold carries its own pitch/date so we can release the right server-side
  // reservation even after the user has navigated to a different view.
  pitchId: string;
  date: string;
  startHour: number;
  reservedUntil: number;
  totalMs: number;
}

export function BookingPage() {
  const { token } = useAuth();
  const toast = useToast();
  const { pitches } = usePitches();
  const days = useMemo(() => upcomingDays(10), []);

  const [pitchId, setPitchId] = useState<string | null>(null);
  const [date, setDate] = useState(days[0]!.iso);
  const [hold, setHold] = useState<Hold | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [confirming, setConfirming] = useState(false);

  const { slots, loading, refetch, patch } = useSlots(token!, pitchId, date);
  const holdRef = useRef<Hold | null>(null);
  holdRef.current = hold;

  // Default to the first pitch once loaded.
  useEffect(() => {
    if (!pitchId && pitches.length) setPitchId(pitches[0]!.id);
  }, [pitches, pitchId]);

  // Leaving a pitch/date view releases the active hold *server-side* too — not just on
  // screen. Otherwise the Redis reservation lingers for its full TTL, and returning to
  // the view shows the slot stuck as 'reserved' with no way to confirm or cancel it
  // (and the user could pile up holds across pitches). The hold carries its own
  // coordinates, so we always free the slot it actually belongs to.
  useEffect(() => {
    return () => {
      const active = holdRef.current;
      if (!active) return;
      void api.releaseSlot(
        { pitchId: active.pitchId, date: active.date, startHour: active.startHour },
        token!,
      );
      setHold(null);
    };
  }, [pitchId, date, token]);

  // Countdown ticker — releases the hold in the UI when it lapses.
  useEffect(() => {
    if (!hold) return;
    const tick = () => {
      const left = hold.reservedUntil - Date.now();
      setRemaining(left);
      if (left <= 0) {
        const expired = holdRef.current;
        setHold(null);
        if (expired) patch(expired.startHour, 'available');
        toast('Your hold expired — the slot is open again', 'info');
        void refetch();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [hold, patch, refetch, toast]);

  const selectedPitch = pitches.find((p) => p.id === pitchId) ?? null;

  const onSelectSlot = async (slot: Slot) => {
    if (!pitchId) return;
    if (hold) {
      toast('Confirm or cancel your current hold first', 'info');
      return;
    }
    try {
      const res = await api.reserveSlot({ pitchId, date, startHour: slot.startHour }, token!);
      const totalMs = res.ttlSeconds * 1000;
      setHold({
        pitchId,
        date,
        startHour: slot.startHour,
        reservedUntil: Date.now() + totalMs,
        totalMs,
      });
      patch(slot.startHour, 'reserved');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not reserve slot', 'error');
      void refetch(); // re-sync with reality
    }
  };

  const onCancel = async () => {
    if (!hold || !pitchId) return;
    const released = hold;
    // Optimistically free it for this user so they can immediately pick another.
    setHold(null);
    patch(released.startHour, 'available');
    try {
      await api.releaseSlot({ pitchId, date, startHour: released.startHour }, token!);
      toast('Hold cancelled — pick any slot', 'info');
    } catch {
      void refetch(); // re-sync if the release didn't land
    }
  };

  const onConfirm = async () => {
    if (!hold || !pitchId) return;
    setConfirming(true);
    try {
      await api.confirmBooking({ pitchId, date, startHour: hold.startHour }, token!);
      patch(hold.startHour, 'booked');
      setHold(null);
      toast('Booked! See you on the pitch.', 'success');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not confirm', 'error');
      setHold(null);
      void refetch();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="pb-32">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-lime/80">Availability</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Book a pitch
        </h1>
      </header>

      {/* Pitch selector */}
      <div className="grid gap-3 sm:grid-cols-3">
        {pitches.map((p) => {
          const active = p.id === pitchId;
          return (
            <button
              key={p.id}
              onClick={() => setPitchId(p.id)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                active
                  ? 'border-lime/60 bg-lime/[0.07] shadow-[0_8px_30px_-12px_rgba(185,247,62,0.4)]'
                  : 'border-chalk/10 bg-turf-850/40 hover:border-chalk/25'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="font-display text-lg font-semibold text-chalk">{p.name}</span>
                {active && <span className="mt-1 h-2 w-2 rounded-full bg-lime" />}
              </div>
              <p className="mt-1 text-sm text-haze">{p.location}</p>
              <p className="mt-3 font-mono text-sm text-chalk-dim">
                ₹{p.pricePerHour}
                <span className="text-haze"> / hour</span>
              </p>
            </button>
          );
        })}
      </div>

      {/* Date strip */}
      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {days.map((d) => {
          const active = d.iso === date;
          return (
            <button
              key={d.iso}
              onClick={() => setDate(d.iso)}
              className={`flex min-w-[4.2rem] flex-col items-center rounded-xl border px-3 py-2.5 transition-all ${
                active
                  ? 'border-lime/60 bg-lime/[0.08]'
                  : 'border-chalk/10 bg-turf-850/30 hover:border-chalk/25'
              }`}
            >
              <span className={`text-[0.65rem] font-medium ${active ? 'text-lime' : 'text-haze'}`}>
                {d.weekday}
              </span>
              <span className="font-mono text-lg font-bold tabular-nums text-chalk">{d.day}</span>
              <span className="text-[0.6rem] text-haze">{d.month}</span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-7 flex flex-wrap items-center gap-5 text-xs text-haze">
        <Legend dot="bg-lime" label="Available" />
        <Legend dot="bg-amber" label="Reserved" />
        <Legend dot="bg-clay" label="Booked" />
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[0.7rem]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
          LIVE
        </span>
      </div>

      {/* Slot grid */}
      <div className="mt-4">
        {loading && slots.length === 0 ? (
          <SkeletonGrid />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {slots.map((slot) => (
              <SlotCell
                key={slot.startHour}
                slot={slot}
                mine={hold?.startHour === slot.startHour}
                onSelect={onSelectSlot}
              />
            ))}
          </div>
        )}
      </div>

      {hold && selectedPitch && (
        <ReservationBar
          pitchName={selectedPitch.name}
          slot={slots.find((s) => s.startHour === hold.startHour)!}
          remainingMs={remaining}
          totalMs={hold.totalMs}
          confirming={confirming}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )}
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-[5.5rem] animate-pulse rounded-2xl border border-chalk/8 bg-turf-850/40" />
      ))}
    </div>
  );
}
