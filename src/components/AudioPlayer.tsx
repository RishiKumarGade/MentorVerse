'use client';

import { useEffect, useRef, useState } from 'react';
import { useAudio, useTheme } from '@/store/useStore';

export default function AudioPlayer() {
  const isAudioEnabled = useAudio();
  const theme = useTheme();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioAvailable, setAudioAvailable] = useState(false);

  // Test if audio file exists when theme changes
  useEffect(() => {
    if (!theme.audio) {
      setAudioAvailable(false);
      return;
    }

    // Test if audio file exists
    const testAudio = new Audio();
    
    const handleLoad = () => {
      setAudioAvailable(true);
    };
    
    const handleError = () => {
      setAudioAvailable(false);
      console.log('Theme audio not available:', theme.audio);
    };

    testAudio.addEventListener('canplaythrough', handleLoad);
    testAudio.addEventListener('error', handleError);
    testAudio.src = theme.audio;

    return () => {
      testAudio.removeEventListener('canplaythrough', handleLoad);
      testAudio.removeEventListener('error', handleError);
    };
  }, [theme.audio]);

  useEffect(() => {
    if (!audioRef.current || !audioAvailable) return;

    const audio = audioRef.current;
    
    if (isAudioEnabled) {
      audio.volume = 0.3; // Set volume to 30%
      audio.play().catch((error) => {
        // Handle autoplay restrictions or file errors
        console.log('Audio autoplay prevented or failed:', error);
        setAudioAvailable(false);
      });
    } else {
      audio.pause();
    }
  }, [isAudioEnabled, audioAvailable]);

  useEffect(() => {
    // Change audio source when theme changes
    if (audioRef.current && theme.audio && audioAvailable) {
      const wasPlaying = !audioRef.current.paused;
      audioRef.current.src = theme.audio;
      
      if (wasPlaying && isAudioEnabled) {
        audioRef.current.play().catch((error) => {
          console.log('Audio play failed:', error);
          setAudioAvailable(false);
        });
      }
    }
  }, [theme.audio, isAudioEnabled, audioAvailable]);

  // Only render if theme has audio and it's available
  if (!theme.audio || !audioAvailable) return null;

  return (
    <audio
      ref={audioRef}
      loop
      preload="metadata"
      className="hidden"
      onError={() => {
        console.log('Audio failed to load:', theme.audio);
        setAudioAvailable(false);
      }}
    >
      <source src={theme.audio} type="audio/mpeg" />
      Your browser does not support the audio element.
    </audio>
  );
}
