import type { Slot } from '../../lib/types';

interface Props {
  slot: Slot;
  mine: boolean;
  onSelect: (slot: Slot) => void;
}

export function SlotCell({ slot, mine, onSelect }: Props) {
  const base =
    'group relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all duration-200';

  if (slot.status === 'booked') {
    return (
      <div className={`${base} cursor-not-allowed border-chalk/8 bg-turf-850/60`}>
        <Time slot={slot} muted />
        <Status dot="bg-clay" label="Booked" className="text-clay/80" />
      </div>
    );
  }

  if (slot.status === 'reserved') {
    return (
      <div
        className={`${base} ${
          mine
            ? 'animate-pulse-amber border-amber/70 bg-amber/10'
            : 'cursor-not-allowed border-amber/25 bg-amber/[0.04]'
        }`}
      >
        <Time slot={slot} accent={mine ? 'text-amber' : undefined} />
        <Status
          dot="bg-amber"
          label={mine ? 'On hold — yours' : 'Reserved'}
          className={mine ? 'text-amber' : 'text-amber/60'}
        />
      </div>
    );
  }

  // available
  return (
    <button
      onClick={() => onSelect(slot)}
      className={`${base} border-chalk/10 bg-turf-850/40 hover:-translate-y-0.5 hover:border-lime/60 hover:bg-lime/[0.06] hover:shadow-[0_8px_30px_-12px_rgba(185,247,62,0.4)]`}
    >
      <Time slot={slot} />
      <Status
        dot="bg-lime"
        label="Available"
        className="text-haze transition-colors group-hover:text-lime"
      />
    </button>
  );
}

function Time({ slot, muted, accent }: { slot: Slot; muted?: boolean; accent?: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className={`font-mono text-lg font-bold tabular-nums ${
          accent ?? (muted ? 'text-haze' : 'text-chalk')
        }`}
      >
        {slot.startTime}
      </span>
      <span className="font-mono text-xs text-haze">– {slot.endTime}</span>
    </div>
  );
}

function Status({ dot, label, className }: { dot: string; label: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-medium ${className ?? ''}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </div>
  );
}
