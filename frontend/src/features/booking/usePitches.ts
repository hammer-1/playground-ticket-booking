import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Pitch } from '../../lib/types';

export function usePitches() {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .getPitches()
      .then((p) => active && setPitches(p))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { pitches, loading };
}
