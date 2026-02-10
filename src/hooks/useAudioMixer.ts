/**
 * Audio Mixer Hook
 * 
 * Custom hook for mixing multiple audio stems using WebAudio API
 * Provides volume, pan, mute, and solo controls
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Stem, StemMixerSettings } from '../types/stem';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../firebase/config';

interface UseAudioMixerOptions {
  /** Array of stems to mix */
  stems: Stem[];
  
  /** Initial mixer settings (optional) */
  initialSettings?: StemMixerSettings[];
  
  /** Sample rate for audio context (default: 44100) */
  sampleRate?: number;
}

interface UseAudioMixerReturn {
  /** Current mixer settings for each stem */
  settings: StemMixerSettings[];
  
  /** Update settings for a specific stem */
  updateSettings: (stemId: string, updates: Partial<StemMixerSettings>) => void;
  
  /** Get settings for a specific stem */
  getSettings: (stemId: string) => StemMixerSettings | undefined;
  
  /** Play all stems */
  play: () => Promise<void>;
  
  /** Pause playback */
  pause: () => void;
  
  /** Stop playback */
  stop: () => void;
  
  /** Whether audio is currently playing */
  isPlaying: boolean;
  
  /** Current playback position in seconds */
  currentTime: number;
  
  /** Duration of the longest stem in seconds */
  duration: number;
  
  /** Master volume (0-1) */
  masterVolume: number;
  
  /** Set master volume */
  setMasterVolume: (volume: number) => void;
  
  /** Get mixed audio buffer (for export) */
  getMixedBuffer: () => Promise<AudioBuffer | null>;
  
  /** Cleanup function */
  cleanup: () => void;
}

/**
 * Audio Mixer Hook
 * Manages WebAudio API context and mixing of multiple stems
 */
export const useAudioMixer = (
  options: UseAudioMixerOptions
): UseAudioMixerReturn => {
  const { stems, initialSettings, sampleRate = 44100 } = options;

  // Audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());
  const pannerNodesRef = useRef<Map<string, StereoPannerNode>>(new Map());
  const sourceNodesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const audioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  
  // State
  const [settings, setSettings] = useState<StemMixerSettings[]>(() => {
    if (initialSettings) {
      return initialSettings;
    }
    // Initialize default settings for each stem
    return stems.map(stem => ({
      stemId: stem.id,
      volume: 1.0,
      pan: 0.0,
      muted: false,
      solo: false,
    }));
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [masterVolume, setMasterVolumeState] = useState(1.0);
  const masterGainRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  // Initialize audio context
  useEffect(() => {
    const initAudioContext = async () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass({ sampleRate });
        
        // Create master gain node
        const masterGain = audioContextRef.current.createGain();
        masterGain.gain.value = masterVolume;
        masterGain.connect(audioContextRef.current.destination);
        masterGainRef.current = masterGain;
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };

    initAudioContext();

    return () => {
      cleanup();
    };
  }, [sampleRate]); // Only reinitialize if sample rate changes

  // Load buffers when stems change or context is ready
  useEffect(() => {
    if (audioContextRef.current && stems.length > 0) {
      loadAudioBuffers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stems.length]); // Only reload when stem count changes

  // Load audio buffers from stem storage paths
  const loadAudioBuffers = useCallback(async () => {
    if (!audioContextRef.current || !storage) return;

    for (const stem of stems) {
      try {
        // Get download URL from Firebase Storage
        let audioUrl: string;
        if (stem.storagePath.startsWith('http://') || stem.storagePath.startsWith('https://')) {
          // Already a URL
          audioUrl = stem.storagePath;
        } else {
          // Firebase Storage path - get download URL
          const storageRef = ref(storage, stem.storagePath);
          audioUrl = await getDownloadURL(storageRef);
        }

        // Fetch audio file
        const response = await fetch(audioUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        
        // Decode audio data
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        audioBuffersRef.current.set(stem.id, audioBuffer);

        // Create gain and panner nodes
        const gainNode = audioContextRef.current.createGain();
        const pannerNode = audioContextRef.current.createStereoPanner();
        
        gainNode.connect(pannerNode);
        pannerNode.connect(masterGainRef.current!);
        
        gainNodesRef.current.set(stem.id, gainNode);
        pannerNodesRef.current.set(stem.id, pannerNode);

        // Apply initial settings
        const stemSettings = settings.find(s => s.stemId === stem.id);
        if (stemSettings) {
          gainNode.gain.value = stemSettings.volume;
          pannerNode.pan.value = stemSettings.pan;
        }
      } catch (error) {
        console.error(`Failed to load audio for stem ${stem.id}:`, error);
      }
    }
  }, [stems, settings]);

  // Update settings
  const updateSettings = useCallback((stemId: string, updates: Partial<StemMixerSettings>) => {
    setSettings(prev => {
      const updated = prev.map(setting => {
        if (setting.stemId === stemId) {
          const newSetting = { ...setting, ...updates };
          
          // Apply to audio nodes immediately
          const gainNode = gainNodesRef.current.get(stemId);
          const pannerNode = pannerNodesRef.current.get(stemId);
          
          if (gainNode && newSetting.volume !== undefined) {
            gainNode.gain.value = newSetting.volume;
          }
          if (pannerNode && newSetting.pan !== undefined) {
            pannerNode.pan.value = newSetting.pan;
          }
          
          return newSetting;
        }
        return setting;
      });
      return updated;
    });
  }, []);

  // Get settings for a stem
  const getSettings = useCallback((stemId: string) => {
    return settings.find(s => s.stemId === stemId);
  }, [settings]);

  // Play all stems
  const play = useCallback(async () => {
    if (!audioContextRef.current) return;
    
    // Prevent double-play
    if (isPlayingRef.current) return;

    // Cancel any existing animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    try {
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Check if any stem is soloed
      const hasSolo = settings.some(s => s.solo);
      const soloedStems = hasSolo ? settings.filter(s => s.solo).map(s => s.stemId) : [];

      // Create and start source nodes for each stem
      const startTime = audioContextRef.current.currentTime;
      startTimeRef.current = startTime;

      for (const stem of stems) {
        const audioBuffer = audioBuffersRef.current.get(stem.id);
        if (!audioBuffer) continue;

        const stemSettings = settings.find(s => s.stemId === stem.id);
        if (!stemSettings) continue;

        // Skip if muted or if another stem is soloed and this one isn't
        if (stemSettings.muted || (hasSolo && !soloedStems.includes(stem.id))) {
          continue;
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(gainNodesRef.current.get(stem.id)!);
        
        source.start(startTime);
        sourceNodesRef.current.set(stem.id, source);
      }

      isPlayingRef.current = true;
      setIsPlaying(true);

      // Update current time
      const maxDuration = Math.max(...stems.map(s => s.duration), 0);
      const updateTime = () => {
        if (audioContextRef.current && isPlayingRef.current) {
          const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
          setCurrentTime(Math.min(elapsed, maxDuration));
          if (elapsed < maxDuration) {
            animationFrameRef.current = requestAnimationFrame(updateTime);
          } else {
            isPlayingRef.current = false;
            setIsPlaying(false);
          }
        }
      };
      updateTime();
    } catch (error) {
      console.error('Failed to play audio:', error);
      isPlayingRef.current = false;
      setIsPlaying(false);
    }
  }, [stems, settings]);

  // Pause playback
  const pause = useCallback(() => {
    if (!audioContextRef.current || !isPlayingRef.current) return;

    // Stop all source nodes
    sourceNodesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (error) {
        // Source may already be stopped
      }
    });
    sourceNodesRef.current.clear();

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  // Stop playback
  const stop = useCallback(() => {
    pause();
    setCurrentTime(0);
    startTimeRef.current = 0;
  }, [pause]);

  // Set master volume
  const setMasterVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setMasterVolumeState(clampedVolume);
    
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = clampedVolume;
    }
  }, []);

  // Get mixed audio buffer for export
  const getMixedBuffer = useCallback(async (): Promise<AudioBuffer | null> => {
    if (!audioContextRef.current || stems.length === 0) return null;

    try {
      // Use OfflineAudioContext for rendering
      const maxDuration = Math.max(...stems.map(s => s.duration));
      const offlineContext = new OfflineAudioContext(
        2,
        Math.ceil(maxDuration * sampleRate),
        sampleRate
      );

      // Create master gain
      const masterGain = offlineContext.createGain();
      masterGain.gain.value = masterVolume;
      masterGain.connect(offlineContext.destination);

      // Mix all stems
      const mixPromises = stems.map(async (stem) => {
        const audioBuffer = audioBuffersRef.current.get(stem.id);
        if (!audioBuffer) return;

        const stemSettings = settings.find(s => s.stemId === stem.id);
        if (!stemSettings || stemSettings.muted) return;

        // Check solo
        const hasSolo = settings.some(s => s.solo);
        if (hasSolo && !stemSettings.solo) return;

        const source = offlineContext.createBufferSource();
        const gainNode = offlineContext.createGain();
        const pannerNode = offlineContext.createStereoPanner();

        source.buffer = audioBuffer;
        gainNode.gain.value = stemSettings.volume;
        pannerNode.pan.value = stemSettings.pan;

        source.connect(gainNode);
        gainNode.connect(pannerNode);
        pannerNode.connect(masterGain);

        source.start(0);
      });

      await Promise.all(mixPromises);

      // Render the mixed audio
      const mixedBuffer = await offlineContext.startRendering();
      return mixedBuffer;
    } catch (error) {
      console.error('Failed to create mixed buffer:', error);
      return null;
    }
  }, [stems, settings, masterVolume, sampleRate]);

  // Calculate duration
  const duration = Math.max(...stems.map(s => s.duration), 0);

  // Cleanup
  const cleanup = useCallback(() => {
    pause();
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    gainNodesRef.current.clear();
    pannerNodesRef.current.clear();
    sourceNodesRef.current.clear();
    audioBuffersRef.current.clear();
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [pause]);

  return {
    settings,
    updateSettings,
    getSettings,
    play,
    pause,
    stop,
    isPlaying,
    currentTime,
    duration,
    masterVolume,
    setMasterVolume,
    getMixedBuffer,
    cleanup,
  };
};

