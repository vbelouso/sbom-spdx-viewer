import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  LinearProgress,
  Alert,
  Button,
  Tabs,
  Tab,
  Stack,
  Card,
  CardContent,
  AlertTitle,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useSBOMLoader } from './hooks/useSBOMLoader';
import { PackageList } from './components/PackageList';
import SimpleFileUpload from './components/SimpleFileUpload';
import { useSbomDiff } from './hooks/useSbomDiff';
import { SbomDiffView } from './components/SbomDiffView';
import FileUploadCard from './components/FileUploadCard';

const getPurlType = (purl: string | undefined): string | null => {
  if (!purl) return null;
  try {
    const type = purl.split(':')[1].split('/')[0];
    return type || null;
  } catch (e) {
    return null;
  }
};

function App() {
  const [view, setView] = useState<'single' | 'diff'>('single');

  const {
    status: singleFileStatus,
    data: singleFileData,
    error: singleFileError,
    isPending: singleFileIsPending,
    loadSbomFile,
    reset: resetSingleFileLoader,
  } = useSBOMLoader();
  const [globalFilter, setGlobalFilter] = useState('');
  const [packageTypeFilter, setPackageTypeFilter] = useState('all');

  const availablePackageTypes = useMemo(() => {
    if (!singleFileData?.packages) return [];
    const types = new Set<string>();
    singleFileData.packages.forEach(pkg => {
      const purl = pkg.externalRefs?.find(ref => ref.referenceType === 'purl')?.referenceLocator;
      const type = getPurlType(purl);
      if (type) types.add(type);
    });
    return ['all', ...Array.from(types).sort()];
  }, [singleFileData?.packages]);

  const filteredPackages = useMemo(() => {
    if (!singleFileData?.packages) return [];
    if (packageTypeFilter === 'all') {
      return singleFileData.packages;
    }
    return singleFileData.packages.filter(pkg => {
      const purl = pkg.externalRefs?.find(ref => ref.referenceType === 'purl')?.referenceLocator;
      return getPurlType(purl) === packageTypeFilter;
    });
  }, [singleFileData?.packages, packageTypeFilter]);

  const handleFileChange = useCallback(
    (_event: unknown, file: File) => {
      setGlobalFilter('');
      setPackageTypeFilter('all');
      loadSbomFile(file);
    },
    [loadSbomFile]
  );

  const handleLoadNewFile = useCallback(() => {
    resetSingleFileLoader();
  }, [resetSingleFileLoader]);

  const diffState = useSbomDiff();
  const [baseFile, setBaseFile] = useState<File | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);

  const handleViewChange = (_event: React.SyntheticEvent, newView: 'single' | 'diff') => {
    if (newView !== view) {
      resetSingleFileLoader();
      diffState.resetDiff();
      setBaseFile(null);
      setNewFile(null);
      setView(newView);
    }
  };

  const renderSingleView = () => {
    if (singleFileIsPending || singleFileStatus === 'parsing') {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            mt: 4,
          }}
        >
          <Typography>Parsing SBOM...</Typography>
          <LinearProgress sx={{ width: 300 }} />
        </Box>
      );
    }
    if (singleFileStatus === 'error') {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to parse SBOM: {singleFileError}
        </Alert>
      );
    }
    if (singleFileStatus === 'success' && singleFileData) {
      return (
        <>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                SBOM Details
              </Typography>
              <Stack spacing={1}>
                <Typography>
                  <b>Name:</b> {singleFileData.name}
                </Typography>
                <Typography>
                  <b>Created:</b> {new Date(singleFileData.creationInfo.created).toLocaleString()}
                </Typography>
                <Typography>
                  <b>SPDX Version:</b> {singleFileData.spdxVersion}
                </Typography>
                <Typography>
                  <b>Packages Displayed:</b> {filteredPackages.length} of {singleFileData.packages.length}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
          <PackageList
            packages={filteredPackages}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            packageTypeFilter={packageTypeFilter}
            onPackageTypeFilterChange={setPackageTypeFilter}
            availablePackageTypes={availablePackageTypes}
            onLoadNewFile={handleLoadNewFile}
          />
        </>
      );
    }

    return <SimpleFileUpload onFileInputChange={handleFileChange} />;
  };

  const renderDiffView = () => (
    <Box>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 1 }}>
        Compare Two SBOMs
      </Typography>

      <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 3 }}>
        <AlertTitle>OCI Packages Only</AlertTitle>
        This comparison view focuses exclusively on packages with a `pkg:oci/...` PURL for the most accurate results.
        Other package types are ignored in this view.
      </Alert>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <FileUploadCard
          title="Base SBOM (Old)"
          fileName={baseFile?.name}
          onFileSelect={setBaseFile}
          disabled={diffState.status === 'diffing'}
        />
        <FileUploadCard
          title="Compare SBOM (New)"
          fileName={newFile?.name}
          onFileSelect={setNewFile}
          disabled={diffState.status === 'diffing'}
        />
      </Stack>

      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={!baseFile || !newFile || diffState.status === 'diffing'}
        onClick={() => baseFile && newFile && diffState.startDiff(baseFile, newFile)}
        sx={{ my: 2, py: 1.5 }}
      >
        {diffState.status === 'diffing' ? diffState.progress || 'Comparing...' : 'Compare SBOMs'}
      </Button>

      {diffState.status === 'diffing' && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" align="center" component="p" sx={{ mb: 1 }}>
            {diffState.progress}
          </Typography>
          <LinearProgress />
        </Box>
      )}
      {diffState.status === 'error' && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {diffState.error}
        </Alert>
      )}
      {diffState.status === 'success' && diffState.data && <SbomDiffView diff={diffState.data} />}
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ my: 4 }}>
      <Tabs value={view} onChange={handleViewChange} sx={{ mb: 3 }} centered>
        <Tab label="Single SBOM Viewer" value="single" />
        <Tab label="Compare SBOMs" value="diff" />
      </Tabs>

      {view === 'single' ? renderSingleView() : renderDiffView()}
    </Container>
  );
}

export default App;
