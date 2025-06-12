import React from 'react';
import { Box, Typography } from '@mui/material';
import FileUploadCard from './FileUploadCard';

interface SimpleFileUploadProps {
  onFileInputChange: (event: unknown, file: File) => void;
}

const SimpleFileUpload: React.FC<SimpleFileUploadProps> = ({ onFileInputChange }) => {
  const handleFileSelect = (file: File) => {
    onFileInputChange(null, file);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ minWidth: 400, maxWidth: 480, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          SPDX SBOM Viewer
        </Typography>
        <FileUploadCard title="Upload Your SBOM" buttonText="Upload" onFileSelect={handleFileSelect} />
      </Box>
    </Box>
  );
};

export default SimpleFileUpload;
