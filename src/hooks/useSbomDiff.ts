import { useState, useRef, useEffect, useCallback } from 'react';
import type { Package } from '../types/spdx';

export interface SbomDiff {
  summary: {
    totalBase: number;
    totalNew: number;
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
  packages: {
    added: Package[];
    removed: Package[];
    modified: { old: Package; new: Package; changeSummary: string }[];
  };
  metrics: {
    parseAndDiffTime: number;
  };
}

type Status = 'idle' | 'diffing' | 'success' | 'error';

interface DiffState {
  status: Status;
  data: SbomDiff | null;
  error: string | null;
  progress: string | null;
}

export const useSbomDiff = () => {
  const [state, setState] = useState<DiffState>({ status: 'idle', data: null, error: null, progress: null });
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const startDiff = useCallback((baseFile: File, newFile: File) => {
    workerRef.current?.terminate();

    workerRef.current = new Worker(new URL('../workers/diffWorker.ts', import.meta.url), {
      type: 'module',
    });

    setState({ status: 'diffing', data: null, error: null, progress: 'Initializing...' });

    workerRef.current.onmessage = event => {
      const { type, payload } = event.data;
      if (type === 'SUCCESS') {
        setState(s => ({ ...s, status: 'success', data: payload, progress: 'Done!' }));
      } else if (type === 'ERROR') {
        setState(s => ({ ...s, status: 'error', data: null, error: payload, progress: 'Failed!' }));
      } else if (type === 'PROGRESS') {
        setState(s => ({ ...s, progress: payload }));
      }
    };

    workerRef.current.onerror = err => {
      setState(s => ({
        ...s,
        status: 'error',
        data: null,
        error: `Worker error: ${err.message}`,
        progress: 'Failed!',
      }));
    };

    workerRef.current.postMessage({ baseFile, newFile });
  }, []);

  const resetDiff = useCallback(() => {
    workerRef.current?.terminate();
    setState({ status: 'idle', data: null, error: null, progress: null });
  }, []);

  return { ...state, startDiff, resetDiff };
};
