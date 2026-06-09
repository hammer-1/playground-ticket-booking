import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import type { Slot, SlotStatus } from '../../lib/types';

interface SlotEvent {
  pitchId: string;
  date: string;
  startHour: number;
}

/**
 * Loads the slot grid for a pitch/date and keeps it live: joins the pitch/date socket
 * room and folds slot:reserved / slot:booked / slot:released events into local state, so
 * the calendar updates with no refresh when anyone else acts.
 */
export function useSlots(token: string, pitchId: string | null, date: string) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!pitchId) return;
    setLoading(true);
    setError(null);
    try {
      setSlots(await api.getSlots(pitchId, date, token));
    } catch {
      setError('Could not load slots');
    } finally {
      setLoading(false);
    }
  }, [pitchId, date, token]);

  const patch = useCallback((startHour: number, status: SlotStatus) => {
    setSlots((prev) =>
      prev.map((s) => (s.startHour === startHour ? { ...s, status } : s)),
    );
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!pitchId) return;
    const socket = getSocket(token);
    const join = () => socket.emit('join', { pitchId, date });
    if (socket.connected) join();
    socket.on('connect', join);

    const onReserved = (e: SlotEvent) => {
      if (e.pitchId === pitchId && e.date === date) patch(e.startHour, 'reserved');
    };
    const onBooked = (e: SlotEvent) => {
      if (e.pitchId === pitchId && e.date === date) patch(e.startHour, 'booked');
    };
    const onReleased = (e: SlotEvent) => {
      // A release only frees a temporary hold; never un-books a confirmed slot.
      if (e.pitchId === pitchId && e.date === date) {
        setSlots((prev) =>
          prev.map((s) =>
            s.startHour === e.startHour && s.status === 'reserved'
              ? { ...s, status: 'available' }
              : s,
          ),
        );
      }
    };

    socket.on('slot:reserved', onReserved);
    socket.on('slot:booked', onBooked);
    socket.on('slot:released', onReleased);

    return () => {
      socket.emit('leave', { pitchId, date });
      socket.off('connect', join);
      socket.off('slot:reserved', onReserved);
      socket.off('slot:booked', onBooked);
      socket.off('slot:released', onReleased);
    };
  }, [token, pitchId, date, patch]);

  return { slots, loading, error, refetch, patch, setSlots };
}
