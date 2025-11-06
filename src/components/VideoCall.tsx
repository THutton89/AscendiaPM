import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { meetingsDb } from '../db/meetings';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Download, FileText } from 'lucide-react';

interface VideoCallProps {
  meetingId: number;
  roomName: string;
  onEndCall?: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({ meetingId, roomName, onEndCall }) => {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingId, setRecordingId] = useState<number | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const { data: recordings } = useQuery({
    queryKey: ['meetingRecordings', meetingId],
    queryFn: () => meetingsDb.getRecordings(meetingId)
  });

  const startRecordingMutation = useMutation({
    mutationFn: () => meetingsDb.startRecording(meetingId),
    onSuccess: (recording) => {
      setRecordingId(recording.id);
      setIsRecording(true);
    }
  });

  const stopRecordingMutation = useMutation({
    mutationFn: async () => {
      if (recordingId) {
        // First stop the recording
        await meetingsDb.stopRecording(recordingId);

        // Then generate a transcript (placeholder for now)
        try {
          const transcript = await window.electronAPI.transcribeAudio(null);
          await meetingsDb.saveTranscript(recordingId, transcript);
        } catch (error) {
          console.error('Failed to generate transcript:', error);
        }

        return true;
      }
    },
    onSuccess: () => {
      setIsRecording(false);
      setRecordingId(null);
      // Refetch recordings to show the updated transcript
      queryClient.invalidateQueries({ queryKey: ['meetingRecordings', meetingId] });
    }
  });

  useEffect(() => {
    // Load Jitsi Meet external script
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = initializeJitsi;
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (window.JitsiMeetExternalAPI) {
        // Jitsi cleanup would go here
      }
    };
  }, []);

  const initializeJitsi = () => {
    if (!window.JitsiMeetExternalAPI || !jitsiContainerRef.current) return;

    const domain = 'meet.jit.si';
    const options = {
      roomName: roomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableRecording: true,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'hangup', 'chat', 'tileview', 'fullscreen',
          'fodeviceselection', 'profile', 'info', 'recording'
        ],
      },
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);

    // Handle recording events
    api.addEventListener('recordingStatusChanged', (event: any) => {
      if (event.on) {
        startRecordingMutation.mutate();
      } else {
        stopRecordingMutation.mutate();
      }
    });

    // Handle call end
    api.addEventListener('videoConferenceLeft', () => {
      onEndCall?.();
    });

    // Store API reference for cleanup
    (window as any).jitsiAPI = api;
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecordingMutation.mutate();
    } else {
      startRecordingMutation.mutate();
    }
  };

  const downloadTranscript = (recording: any) => {
    if (recording.transcript) {
      const blob = new Blob([recording.transcript], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meeting-${meetingId}-transcript.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gray-800 text-white">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">Video Conference</h2>
          {isRecording && (
            <div className="flex items-center space-x-2 text-red-400">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Recording</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleRecording}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isRecording
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>

          <button
            onClick={onEndCall}
            className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            End Call
          </button>
        </div>
      </div>

      {/* Jitsi Container */}
      <div className="flex-1 relative">
        <div ref={jitsiContainerRef} className="w-full h-full" />
      </div>

      {/* Recordings Panel */}
      {recordings && recordings.length > 0 && (
        <div className="bg-gray-800 p-4 border-t border-gray-700">
          <h3 className="text-white font-medium mb-3">Meeting Recordings</h3>
          <div className="space-y-2">
            {recordings.map((recording) => (
              <div key={recording.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                <div className="text-white">
                  <div className="text-sm">
                    Status: <span className={`font-medium ${
                      recording.status === 'completed' ? 'text-green-400' :
                      recording.status === 'recording' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>{recording.status}</span>
                  </div>
                  {recording.duration && (
                    <div className="text-xs text-gray-400">
                      Duration: {Math.floor(recording.duration / 60)}:{(recording.duration % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  {recording.transcript && (
                    <button
                      onClick={() => downloadTranscript(recording)}
                      className="flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Transcript
                    </button>
                  )}

                  {recording.recording_url && (
                    <button
                      onClick={() => window.open(recording.recording_url, '_blank')}
                      className="flex items-center px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                    >
                      <Video className="w-3 h-3 mr-1" />
                      View Recording
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Add Jitsi types
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default VideoCall;