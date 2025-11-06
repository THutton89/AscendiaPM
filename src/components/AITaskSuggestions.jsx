import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { lmStudioClient } from '../utils/lmStudioClient';

export const AITaskSuggestions = ({ taskDescription, onApplySuggestion }) => {
  const [suggestions, setSuggestions] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const prompt = `Given this task description: "${taskDescription}", 
        suggest 3 optimized versions with better clarity, estimated duration, 
        and potential dependencies. Return as JSON array.`;
      
      const response = await lmStudioClient.getSummary(prompt);
      const parsed = JSON.parse(response);
      setSuggestions(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        AI Task Suggestions
      </Typography>
      
      {!loading && suggestions.length === 0 && (
        <Button 
          variant="outlined" 
          onClick={fetchSuggestions}
          disabled={!taskDescription}
        >
          Get AI Suggestions
        </Button>
      )}

      {loading && <Typography>Loading suggestions...</Typography>}

      {suggestions.map((suggestion, index) => (
        <Box key={index} sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5' }}>
          <Typography variant="subtitle1">
            {suggestion.title || 'Suggested Task'}
          </Typography>
          <Typography variant="body2">
            {suggestion.description}
          </Typography>
          {suggestion.duration && (
            <Typography variant="caption">
              Estimated: {suggestion.duration} hours
            </Typography>
          )}
          <Button 
            size="small" 
            onClick={() => onApplySuggestion(suggestion)}
            sx={{ mt: 1 }}
          >
            Apply
          </Button>
        </Box>
      ))}
    </Box>
  );
};