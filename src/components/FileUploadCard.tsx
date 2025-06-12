import React from 'react';
import { Card, CardContent, Typography, Button } from '@mui/material';

interface FileUploadCardProps {
  title: string;
  buttonText?: string;
  onFileSelect: (file: File) => void;
  fileName?: string;
  disabled?: boolean;
}

const FileUploadCard: React.FC<FileUploadCardProps> = ({
  title,
  buttonText = 'Select File',
  onFileSelect,
  fileName,
  disabled = false,
}) => {
  return (
    <Card sx={{ flex: 1, textAlign: 'center' }}>
      <CardContent>
        <Typography variant="h6" color={disabled ? 'text.disabled' : 'text.primary'}>
          {title}
        </Typography>
        <Button variant="outlined" component="label" fullWidth sx={{ mt: 2 }} disabled={disabled}>
          {fileName || buttonText}
          <input
            type="file"
            hidden
            accept=".json"
            onClick={e => (e.currentTarget.value = '')}
            onChange={e => e.target.files?.[0] && onFileSelect(e.target.files[0])}
          />
        </Button>
      </CardContent>
    </Card>
  );
};

export default FileUploadCard;
