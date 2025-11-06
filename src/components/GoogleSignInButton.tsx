import React from 'react';
import { Button } from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';

interface GoogleSignInButtonProps {
  onSignIn: (user: any) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSignIn,
  onError,
  disabled = false,
  loading = false
}) => {
  const handleGoogleSignIn = async () => {
    try {
      const result = await window.electronAPI.googleOAuthSignin();

      if (result.success) {
        onSignIn(result.user);
      } else {
        onError(result.error || 'Google sign-in failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      onError('An unexpected error occurred during sign-in');
    }
  };

  return (
    <Button
      variant="outlined"
      fullWidth
      onClick={handleGoogleSignIn}
      disabled={disabled || loading}
      startIcon={<GoogleIcon />}
      sx={{
        borderColor: '#dadce0',
        color: '#3c4043',
        textTransform: 'none',
        fontSize: '14px',
        fontWeight: 500,
        padding: '10px 24px',
        '&:hover': {
          backgroundColor: '#f8f9fa',
          borderColor: '#dadce0',
        },
        '&:disabled': {
          color: '#dadce0',
        }
      }}
    >
      {loading ? 'Signing in...' : 'Continue with Google'}
    </Button>
  );
};

export default GoogleSignInButton;