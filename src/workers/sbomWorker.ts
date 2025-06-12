import type { SPDXDocument } from '../types/spdx.d.ts';
self.onmessage = async (event: MessageEvent<File>) => {
  const file = event.data;
  try {
    const startTime = performance.now();

    const fileContent = await file.text();
    const parsedData: SPDXDocument = JSON.parse(fileContent);

    const endTime = performance.now();
    const parseTime = endTime - startTime;
    const fileSize = file.size / (1024 * 1024);

    self.postMessage({
      type: 'SUCCESS',
      payload: {
        data: parsedData,
        metrics: { parseTime, fileSize },
      },
    });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      payload: error instanceof Error ? error.message : 'Unknown worker error',
    });
  }
};

export {};
console.log('SBOM Worker loaded');
