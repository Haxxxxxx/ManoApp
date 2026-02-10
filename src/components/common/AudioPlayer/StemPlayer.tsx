/**
 * Stem Player Component
 * 
 * Simple audio player for individual stems
 */

import React, { useRef, useState, useEffect } from 'react';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import { PlayArrow, Pause, VolumeUp } from '@mui/icons-material';
import { Stem } from '../../../types/stem';
import { formatDuration } from '../../../utils/formatters';

interface StemPlayerProps {
  stem: Stem;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
}

const StemPlayer: React.FC<StemPlayerProps> = ({ stem, volume = 1.0, onVolumeChange }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (_: Event, value: number | number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value as number;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
      <IconButton onClick={handlePlayPause} color="primary" size="small">
        {isPlaying ? <Pause /> : <PlayArrow />}
      </IconButton>
      
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          {stem.label}
        </Typography>
        <Slider
          value={currentTime}
          max={duration || 100}
          onChange={handleSeek}
          size="small"
          sx={{ mt: 1 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {formatDuration(currentTime)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDuration(duration)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
        <VolumeUp fontSize="small" color="action" />
        <Slider
          value={volume * 100}
          onChange={(_, value) => onVolumeChange?.((value as number) / 100)}
          min={0}
          max={100}
          size="small"
          sx={{ width: 80 }}
        />
      </Box>

      <audio ref={audioRef} src={stem.storagePath} preload="metadata" />
    </Box>
  );
};

export default StemPlayer;

