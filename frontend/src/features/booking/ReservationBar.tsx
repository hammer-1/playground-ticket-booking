import type { Slot } from '../../lib/types';

interface Props {
  pitchName: string;
  slot: Slot;
  remainingMs: number;
  totalMs: number;
  confirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function format(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function ReservationBar({
  pitchName,
  slot,
  remainingMs,
  totalMs,
  confirming,
  onConfirm,
  onCancel,
}: Props) {
  const pct = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
  const urgent = remainingMs < 30_000;

  return (
    <div className="animate-rise fixed inset-x-0 bottom-0 z-40 px-4 pb-5">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-amber/40 bg-turf-850/90 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        {/* draining progress bar */}
        <div className="h-1 w-full bg-amber/15">
          <div
            className="h-full bg-amber transition-[width] duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex flex-col items-center gap-4 p-4 sm:flex-row sm:justify-between sm:p-5">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-16 flex-col items-center justify-center rounded-xl border ${
                urgent ? 'border-clay/50 bg-clay/10' : 'border-amber/40 bg-amber/10'
              }`}
            >
              <span
                className={`font-mono text-lg font-bold tabular-nums ${
                  urgent ? 'text-clay' : 'text-amber'
                }`}
              >
                {format(remainingMs)}
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-haze">Slot held — confirm now</p>
              <p className="font-display text-base font-semibold text-chalk">
                {pitchName} · {slot.startTime}–{slot.endTime}
              </p>
            </div>
          </div>

          <div className="flex w-full items-center gap-3 sm:w-auto">
            <button
              onClick={onCancel}
              disabled={confirming}
              className="flex-1 rounded-xl border border-chalk/20 px-5 py-3 font-semibold text-chalk-dim transition-colors hover:border-clay/50 hover:text-clay disabled:opacity-60 sm:flex-none"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={confirming}
              className="flex-1 rounded-xl bg-lime px-7 py-3 font-semibold text-turf-950 transition-transform active:scale-[0.99] disabled:opacity-60 sm:flex-none"
            >
              {confirming ? 'Confirming…' : 'Confirm booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
