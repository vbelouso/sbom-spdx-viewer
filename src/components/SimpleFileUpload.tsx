import React, { useState, useRef } from 'react';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

interface SimpleFileUploadProps {
  onFileInputChange: (event: unknown, file: File) => void;
}

const SimpleFileUpload: React.FC<SimpleFileUploadProps> = React.memo(({ onFileInputChange }) => {
  const [filename, setFilename] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFilename(file.name);
      onFileInputChange(event, file);
    }
  };

  const handleClear = () => {
    setFilename('');

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card sx={{ minWidth: 400, maxWidth: 480, textAlign: 'center' }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            SPDX SBOM Viewer
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Select a JSON-formatted SPDX file to begin.
          </Typography>
          <Button variant="contained" component="label" startIcon={<UploadFileIcon />} fullWidth sx={{ my: 2 }}>
            {filename || 'Upload SBOM File'}
            <input ref={inputRef} type="file" accept=".json" hidden onChange={handleFileInputChange} />
          </Button>
          {filename && (
            <Button variant="outlined" color="secondary" fullWidth onClick={handleClear}>
              Clear Selection
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
});

export default SimpleFileUpload;
