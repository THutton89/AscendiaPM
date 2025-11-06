import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { lmStudioClient } from '../utils/lmStudioClient';

interface AISuggestion {
  title?: string;
  description: string;
  duration?: number;
  [key: string]: any; // Allow additional properties from AI response
}

interface AITaskSuggestionsProps {
  taskDescription: string;
  onApplySuggestion: (suggestion: AISuggestion) => void;
}

export const AITaskSuggestions: React.FC<AITaskSuggestionsProps> = React.memo(({
  taskDescription,
  onApplySuggestion
}) => {
  const [suggestions, setSuggestions] = React.useState<AISuggestion[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const fetchSuggestions = async (): Promise<void> => {
    if (!taskDescription.trim()) {
      console.warn('Cannot fetch suggestions: task description is empty');
      return;
    }

    setLoading(true);
    try {
      const prompt = `Given this task description: "${taskDescription}",
        suggest 3 optimized versions with better clarity, estimated duration,
        and potential dependencies. Return as JSON array.`;

      const response: string = await lmStudioClient.getSummary(prompt);

      if (!response || response.trim() === '') {
        throw new Error('Empty response from AI service');
      }

      const parsed: any = JSON.parse(response);

      if (!Array.isArray(parsed)) {
        console.warn('AI response is not an array, using empty suggestions');
        setSuggestions([]);
      } else {
        setSuggestions(parsed);
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      setSuggestions([]);
      // Could add user notification here
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
});