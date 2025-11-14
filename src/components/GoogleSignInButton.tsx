import React from 'react';
import { Button } from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { api } from '../utils/api';

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
      // Get the OAuth URL from backend
      const result = await api('google-oauth-signin');

      if (!result || !result.authUrl) {
        throw new Error('Failed to get OAuth URL');
      }

      // Store the current page for redirect after OAuth
      sessionStorage.setItem('oauth-redirect', window.location.href);

      // Redirect to Google OAuth
      window.location.href = result.authUrl;
    } catch (error) {
      console.error('Google sign-in error:', error);
      onError(error.message || 'An unexpected error occurred during sign-in');
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