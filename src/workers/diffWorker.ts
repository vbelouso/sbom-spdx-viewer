import type { Package } from '../types/spdx';

async function* streamOciPackages(stream: ReadableStream<Uint8Array>, fileName: string) {
  console.log(`[Worker] streamOciPackages: Starting to process ${fileName}`);
  self.postMessage({ type: 'PROGRESS', payload: `Filtering OCI packages in ${fileName}...` });

  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  let braceDepth = 0;
  let objectStartIndex = -1;
  let inPackagesArray = false;
  let yieldedCount = 0;

  while (!inPackagesArray) {
    const { done, value } = await reader.read();
    if (done) {
      if (buffer.trim().length > 0 && !inPackagesArray) {
        console.error(`[Worker] streamOciPackages: Reached end of ${fileName} without finding a 'packages' array.`);
        throw new Error("Could not find a 'packages' array in the SBOM file.");
      }
      console.log(`[Worker] streamOciPackages: Finished processing ${fileName} (no packages array found).`);
      return;
    }
    buffer += value;
    const packagesKeyIndex = buffer.indexOf('"packages"');
    if (packagesKeyIndex !== -1) {
      const arrayStartIndex = buffer.indexOf('[', packagesKeyIndex);
      if (arrayStartIndex !== -1) {
        inPackagesArray = true;
        buffer = buffer.slice(arrayStartIndex);
        braceDepth = 0;
      }
    }
  }

  while (true) {
    objectStartIndex = buffer.indexOf('{', 0);
    if (objectStartIndex === -1) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += value;
      continue;
    }

    braceDepth = 1;
    let objectEndIndex = -1;
    for (let i = objectStartIndex + 1; i < buffer.length; i++) {
      const char = buffer[i];
      if (char === '{') braceDepth++;
      else if (char === '}') {
        braceDepth--;
        if (braceDepth === 0) {
          objectEndIndex = i;
          break;
        }
      }
    }

    if (objectEndIndex !== -1) {
      const objectStr = buffer.substring(objectStartIndex, objectEndIndex + 1);
      try {
        const pkg = JSON.parse(objectStr) as Package;

        const purl = pkg.externalRefs?.find(ref => ref.referenceType === 'purl')?.referenceLocator;
        if (purl && purl.startsWith('pkg:oci/')) {
          yield pkg;
          yieldedCount++;
          if (yieldedCount % 5000 === 0) {
            self.postMessage({ type: 'PROGRESS', payload: `Found ${yieldedCount} OCI packages in ${fileName}...` });
          }
        }
      } catch (e) {}
      buffer = buffer.slice(objectEndIndex + 1);
    } else {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += value;
    }
  }
  console.log(`[Worker] streamOciPackages: Finished streaming ${fileName}. Total OCI packages: ${yieldedCount}.`);
}

function getArtifactKey(pkg: Package): string {
  return (
    pkg.externalRefs?.find(ref => ref.referenceType === 'purl')?.referenceLocator ||
    `no-purl:${pkg.name}@${pkg.versionInfo}`
  );
}

function getSemanticKey(pkg: Package): string {
  const purlRef = pkg.externalRefs?.find(ref => ref.referenceType === 'purl');

  const purlStr = purlRef!.referenceLocator;

  try {
    const purl = new URL(purlStr.replace('pkg:', 'pkg://'));

    const name = purl.pathname.split('@')[0];
    const arch = purl.searchParams.get('arch');

    let key = `pkg:${name}`;

    if (arch) {
      key += `?arch=${arch}`;
    }
    return key;
  } catch (e) {
    return `malformed-purl:${purlStr}`;
  }
}

function createChangeSummary(oldPkg: Package, newPkg: Package): string {
  const changes: string[] = [];
  const oldPurl = oldPkg.externalRefs?.find(r => r.referenceType === 'purl')?.referenceLocator || '';
  const newPurl = newPkg.externalRefs?.find(r => r.referenceType === 'purl')?.referenceLocator || '';
  const oldDigest = oldPurl.split('@')[1]?.split('?')[0] || oldPkg.versionInfo;
  const newDigest = newPurl.split('@')[1]?.split('?')[0] || newPkg.versionInfo;

  if (oldDigest !== newDigest) changes.push('Digest/Version');
  if (oldPkg.licenseConcluded !== newPkg.licenseConcluded) changes.push('License');
  if (changes.length === 0) return 'Metadata';
  return changes.join(' & ');
}

self.onmessage = async (event: MessageEvent<{ baseFile: File; newFile: File }>) => {
  const { baseFile, newFile } = event.data;
  const startTime = performance.now();
  try {
    const baseSemanticMap = new Map<string, Package[]>();
    for await (const pkg of streamOciPackages(baseFile.stream(), baseFile.name)) {
      const key = getSemanticKey(pkg);
      if (!baseSemanticMap.has(key)) baseSemanticMap.set(key, []);
      baseSemanticMap.get(key)!.push(pkg);
    }

    const newSemanticMap = new Map<string, Package[]>();
    for await (const pkg of streamOciPackages(newFile.stream(), newFile.name)) {
      const key = getSemanticKey(pkg);
      if (!newSemanticMap.has(key)) newSemanticMap.set(key, []);
      newSemanticMap.get(key)!.push(pkg);
    }

    const totalBase = baseSemanticMap.size;
    const totalNew = newSemanticMap.size;

    const diffResult = {
      added: [] as Package[],
      removed: [] as Package[],
      modified: [] as { old: Package; new: Package; changeSummary: string }[],
    };
    const allSemanticKeys = new Set([...baseSemanticMap.keys(), ...newSemanticMap.keys()]);

    for (const key of allSemanticKeys) {
      const oldPkgs = baseSemanticMap.get(key);
      const newPkgs = newSemanticMap.get(key);

      if (oldPkgs && !newPkgs) {
        diffResult.removed.push(oldPkgs[0]);
      } else if (!oldPkgs && newPkgs) {
        diffResult.added.push(newPkgs[0]);
      } else if (oldPkgs && newPkgs) {
        const oldArtifactKeys = new Set(oldPkgs.map(getArtifactKey));
        const newArtifactKeys = new Set(newPkgs.map(getArtifactKey));

        let setsAreEqual =
          oldArtifactKeys.size === newArtifactKeys.size && [...oldArtifactKeys].every(k => newArtifactKeys.has(k));

        if (!setsAreEqual) {
          const oldRep = oldPkgs[0];
          const newRep = newPkgs[0];
          const changeSummary = createChangeSummary(oldRep, newRep);
          diffResult.modified.push({ old: oldRep, new: newRep, changeSummary });
        }
      }
    }

    const endTime = performance.now();
    self.postMessage({
      type: 'SUCCESS',
      payload: {
        summary: {
          totalBase,
          totalNew,
          added: diffResult.added.length,
          removed: diffResult.removed.length,
          modified: diffResult.modified.length,
          unchanged: totalBase - diffResult.modified.length - diffResult.removed.length,
        },
        packages: diffResult,
        metrics: { parseAndDiffTime: endTime - startTime },
      },
    });
  } catch (error) {
    self.postMessage({ type: 'ERROR', payload: error instanceof Error ? error.message : 'Unknown worker error' });
  }
};
