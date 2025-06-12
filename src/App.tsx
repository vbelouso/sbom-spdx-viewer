import { useState, useMemo, useCallback, useEffect } from 'react';
import { Box, Typography, LinearProgress, Alert, Container, Stack, Card, CardContent } from '@mui/material';
import { useSBOMLoader } from './hooks/useSBOMLoader';
import { PackageList } from './components/PackageList';
import SimpleFileUpload from './components/SimpleFileUpload';

const getPurlType = (purl: string | undefined): string | null => {
  if (!purl || !purl.startsWith('pkg:')) {
    return null;
  }
  const typeEndIndex = purl.indexOf('/', 4);
  if (typeEndIndex === -1) {
    return purl.substring(4);
  }
  return purl.substring(4, typeEndIndex);
};

function App() {
  const { status, data, error, isPending, loadSbomFile, reset } = useSBOMLoader();
  const [globalFilter, setGlobalFilter] = useState('');
  const [packageTypeFilter, setPackageTypeFilter] = useState('oci');

  const availablePackageTypes = useMemo(() => {
    if (!data?.packages) return [];
    const types = new Set<string>();
    data.packages.forEach(pkg => {
      const packageManagerRef = pkg.externalRefs?.find(
        ref => ref.referenceCategory === 'PACKAGE_MANAGER' && ref.referenceType === 'purl'
      );
      if (packageManagerRef) {
        const type = getPurlType(packageManagerRef.referenceLocator);
        if (type) types.add(type);
      }
    });
    return Array.from(types).sort();
  }, [data?.packages]);

  const filteredPackages = useMemo(() => {
    if (!data?.packages) return [];
    if (packageTypeFilter === 'ALL') return data.packages;

    return data.packages.filter(pkg =>
      pkg.externalRefs?.some(
        ref =>
          ref.referenceCategory === 'PACKAGE_MANAGER' &&
          ref.referenceType === 'purl' &&
          getPurlType(ref.referenceLocator) === packageTypeFilter
      )
    );
  }, [data?.packages, packageTypeFilter]);

  useEffect(() => {
    if (status === 'success' && availablePackageTypes.length > 0) {
      if (!availablePackageTypes.includes('oci')) {
        setPackageTypeFilter('ALL');
      } else {
        setPackageTypeFilter('oci');
      }
    }
  }, [status, availablePackageTypes]);

  const handleFileChange = useCallback(
    (_event: unknown, file: File) => {
      setGlobalFilter('');
      loadSbomFile(file);
    },
    [loadSbomFile]
  );

  const handleLoadNewFile = useCallback(() => {
    reset();
  }, [reset]);

  return (
    <Container maxWidth="xl" sx={{ my: 4 }}>
      {(isPending || status === 'parsing') && (
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Typography>Parsing SBOM...</Typography>
          <LinearProgress sx={{ width: 300 }} />
        </Box>
      )}

      {status === 'idle' && <SimpleFileUpload onFileInputChange={handleFileChange} />}

      {status === 'error' && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to parse SBOM: {error}
        </Alert>
      )}

      {status === 'success' && data && (
        <>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                SBOM Details
              </Typography>
              <Stack spacing={1}>
                <Typography>
                  <b>Name:</b> {data.name}
                </Typography>
                <Typography>
                  <b>Created:</b> {new Date(data.creationInfo.created).toLocaleString()}
                </Typography>
                <Typography>
                  <b>SPDX Version:</b> {data.spdxVersion}
                </Typography>
                <Typography>
                  <b>Document Namespace:</b> {data.documentNamespace}
                </Typography>
                <Typography>
                  <b>Packages Displayed:</b> {filteredPackages.length} of {data.packages.length}
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <PackageList
            packages={filteredPackages}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            onLoadNewFile={handleLoadNewFile}
            packageTypeFilter={packageTypeFilter}
            onPackageTypeFilterChange={setPackageTypeFilter}
            availablePackageTypes={availablePackageTypes}
          />
        </>
      )}
    </Container>
  );
}

export default App;
