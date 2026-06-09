import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../../lib/api';
import type { Booking } from '../../lib/types';
import { usePitches } from './usePitches';

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function MyBookingsPage() {
  const { token } = useAuth();
  const { pitches } = usePitches();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMyBookings(token!)
      .then(setBookings)
      .finally(() => setLoading(false));
  }, [token]);

  const pitchName = (id: string) => pitches.find((p) => p.id === id)?.name ?? 'Pitch';

  return (
    <div>
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-lime/80">Your sessions</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          My bookings
        </h1>
      </header>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-chalk/8 bg-turf-850/40" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-chalk/15 bg-turf-850/30 p-12 text-center">
          <p className="font-display text-xl font-semibold text-chalk">No bookings yet</p>
          <p className="mt-2 text-sm text-chalk-dim">Your confirmed slots will show up here.</p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-xl bg-lime px-6 py-2.5 font-semibold text-turf-950"
          >
            Book a pitch
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-2xl border border-chalk/10 bg-turf-850/40 p-5"
            >
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl border border-lime/30 bg-lime/[0.06]">
                  <span className="font-mono text-base font-bold tabular-nums text-lime">
                    {b.startTime.slice(0, 2)}
                  </span>
                  <span className="text-[0.6rem] text-haze">HRS</span>
                </div>
                <div>
                  <p className="font-display text-lg font-semibold text-chalk">
                    {pitchName(b.pitchId)}
                  </p>
                  <p className="text-sm text-haze">
                    {formatDate(b.bookingDate)} · {b.startTime}–{b.endTime}
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-lime">
                {b.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
