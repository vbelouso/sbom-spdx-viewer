import { useState, useRef, useEffect, useTransition, useCallback } from 'react';
import type { SPDXDocument, PerformanceMetrics } from '@app/types/spdx.d.ts';

type Status = 'idle' | 'parsing' | 'success' | 'error';

interface SbomState {
  status: Status;
  data: SPDXDocument | null;
  error: string | null;
  metrics: PerformanceMetrics | null;
}

export const useSBOMLoader = () => {
  const [state, setState] = useState<SbomState>({
    status: 'idle',
    data: null,
    error: null,
    metrics: null,
  });

  const [isPending, startTransition] = useTransition();
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const loadSbomFile = useCallback((file: File) => {
    workerRef.current?.terminate();
    workerRef.current = new Worker(new URL('../workers/sbomWorker.ts', import.meta.url), {
      type: 'module',
    });

    setState({ status: 'parsing', data: null, error: null, metrics: null });

    workerRef.current.onmessage = event => {
      const { type, payload } = event.data;
      if (type === 'SUCCESS') {
        startTransition(() => {
          setState({
            status: 'success',
            data: payload.data,
            metrics: payload.metrics,
            error: null,
          });
        });
      } else if (type === 'ERROR') {
        setState({ status: 'error', data: null, metrics: null, error: payload });
      }
    };

    workerRef.current.onerror = err => {
      setState({ status: 'error', data: null, metrics: null, error: `Worker error: ${err.message}` });
    };

    workerRef.current.postMessage(file);
  }, []);

  const reset = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setState({ status: 'idle', data: null, error: null, metrics: null });
  }, []);

  return { ...state, isPending, loadSbomFile, reset };
};
