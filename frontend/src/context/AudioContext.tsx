import React, { createContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SfxType = 'complete' | 'levelUp' | 'click' | 'warning' | 'lose' | 'start' | 'rankUp' | 'rankDown' | 'navigate' | 'winrateUp' | 'winrateDown';

type AudioContextType = {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  setBgmEnabled: (val: boolean) => void;
  setSfxEnabled: (val: boolean) => void;
  playSfx: (type: SfxType) => void;
  startWarningSfx: () => void;
  stopWarningSfx: () => void;
  playTallySfx: () => void;
  stopTallySfx: () => void;
  playBgm: () => void;
  stopBgm: () => void;
  bgmPlaying: boolean;
};

export const AudioContext = createContext<AudioContextType>({
  bgmEnabled: true,
  sfxEnabled: true,
  setBgmEnabled: () => {},
  setSfxEnabled: () => {},
  playSfx: () => {},
  startWarningSfx: () => {},
  stopWarningSfx: () => {},
  playTallySfx: () => {},
  stopTallySfx: () => {},
  playBgm: () => {},
  stopBgm: () => {},
  bgmPlaying: false,
});

// =======================================================
// Web Audio API: Synthesized Sound Effects & BGM
// No external files or URLs needed — 100% reliable on web
// =======================================================

let webAudioContext: any = null;

function getWebAudioCtx(): any {
  if (Platform.OS !== 'web') return null;
  if (!webAudioContext) {
    const W = window as any;
    const AudioCtxClass = W.AudioContext || W.webkitAudioContext;
    if (AudioCtxClass) {
      webAudioContext = new AudioCtxClass();
    }
  }
  // Resume if suspended (autoplay policy)
  if (webAudioContext && webAudioContext.state === 'suspended') {
    webAudioContext.resume().catch(() => {});
  }
  return webAudioContext;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3, delay = 0) {
  const ctx = getWebAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

function playNoise(duration: number, volume = 0.15, delay = 0) {
  const ctx = getWebAudioCtx();
  if (!ctx) return;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * volume;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(ctx.currentTime + delay);
}

// --- Synthesized SFX patterns ---

function webSfxComplete() {
  // Victory fanfare: ascending arpeggio + chime
  playTone(523, 0.15, 'square', 0.25, 0);     // C5
  playTone(659, 0.15, 'square', 0.25, 0.1);   // E5
  playTone(784, 0.15, 'square', 0.25, 0.2);   // G5
  playTone(1047, 0.4, 'square', 0.3, 0.3);    // C6 (held)
  playTone(1047, 0.6, 'sine', 0.2, 0.3);      // C6 shimmer
  playTone(1319, 0.5, 'sine', 0.15, 0.5);     // E6 sparkle
  // Add some sparkle noise
  playNoise(0.1, 0.08, 0.3);
  playNoise(0.1, 0.06, 0.5);
}

function webSfxStart() {
  // Quick start beep: two rising tones
  playTone(440, 0.12, 'square', 0.2, 0);      // A4
  playTone(660, 0.2, 'square', 0.25, 0.12);   // E5
  playTone(880, 0.15, 'sine', 0.15, 0.25);    // A5 shimmer
}

function webSfxLose() {
  // Sad descending tones
  playTone(440, 0.25, 'sawtooth', 0.2, 0);    // A4
  playTone(370, 0.25, 'sawtooth', 0.2, 0.2);  // F#4
  playTone(311, 0.25, 'sawtooth', 0.2, 0.4);  // Eb4
  playTone(262, 0.5, 'sawtooth', 0.25, 0.6);  // C4 (held)
  playNoise(0.3, 0.1, 0.6);
}

function webSfxClick() {
  playTone(800, 0.06, 'square', 0.15, 0);
  playTone(1200, 0.04, 'square', 0.1, 0.03);
}

function webSfxLevelUp() {
  // Fanfare with longer ascending scale
  playTone(523, 0.12, 'square', 0.2, 0);
  playTone(587, 0.12, 'square', 0.2, 0.08);
  playTone(659, 0.12, 'square', 0.2, 0.16);
  playTone(784, 0.12, 'square', 0.2, 0.24);
  playTone(880, 0.12, 'square', 0.2, 0.32);
  playTone(1047, 0.5, 'square', 0.3, 0.4);
  playTone(1319, 0.4, 'sine', 0.2, 0.5);
  playNoise(0.15, 0.06, 0.4);
  playNoise(0.1, 0.05, 0.6);
}

function webSfxRankUp() {
  // Epic rank up: triumphant brass-like fanfare
  playTone(392, 0.2, 'square', 0.2, 0);       // G4
  playTone(494, 0.2, 'square', 0.2, 0.15);    // B4
  playTone(587, 0.2, 'square', 0.2, 0.3);     // D5
  playTone(784, 0.3, 'square', 0.25, 0.45);   // G5
  playTone(988, 0.5, 'square', 0.3, 0.6);     // B5 (climax)
  playTone(1175, 0.6, 'sine', 0.25, 0.7);     // D6 shimmer
  playTone(1568, 0.8, 'sine', 0.15, 0.85);    // G6 sparkle
  // Sparkle effects
  playNoise(0.15, 0.08, 0.6);
  playNoise(0.12, 0.06, 0.8);
  playNoise(0.1, 0.05, 1.0);
}

function webSfxRankDown() {
  // Somber rank down: descending minor tones
  playTone(784, 0.25, 'sawtooth', 0.2, 0);    // G5
  playTone(622, 0.25, 'sawtooth', 0.2, 0.2);  // Eb5
  playTone(466, 0.3, 'sawtooth', 0.2, 0.4);   // Bb4
  playTone(370, 0.4, 'sawtooth', 0.25, 0.6);  // F#4
  playTone(311, 0.6, 'sawtooth', 0.2, 0.85);  // Eb4
  playNoise(0.4, 0.12, 0.6);
}

function webSfxNavigate() {
  // Quick whoosh/transition sound
  playTone(600, 0.08, 'sine', 0.15, 0);
  playTone(900, 0.06, 'sine', 0.12, 0.04);
  playTone(1200, 0.04, 'sine', 0.1, 0.07);
}

function webSfxWinrateUp() {
  // Cheerful ascending chime
  playTone(659, 0.12, 'sine', 0.2, 0);        // E5
  playTone(784, 0.12, 'sine', 0.2, 0.1);      // G5
  playTone(988, 0.12, 'sine', 0.2, 0.2);      // B5
  playTone(1319, 0.3, 'sine', 0.25, 0.3);     // E6
  playNoise(0.08, 0.05, 0.3);
}

function webSfxWinrateDown() {
  // Sad two-note drop
  playTone(523, 0.2, 'triangle', 0.2, 0);     // C5
  playTone(392, 0.3, 'triangle', 0.2, 0.15);  // G4
  playTone(330, 0.4, 'triangle', 0.15, 0.3);  // E4
}

// Warning: repeating beep pattern
let warningInterval: ReturnType<typeof setInterval> | null = null;

function webStartWarning() {
  if (warningInterval) return;
  const beep = () => {
    playTone(880, 0.1, 'square', 0.25, 0);
    playTone(880, 0.1, 'square', 0.25, 0.15);
  };
  beep(); // Play immediately
  warningInterval = setInterval(beep, 600);
}

function webStopWarning() {
  if (warningInterval) {
    clearInterval(warningInterval);
    warningInterval = null;
  }
}

function webSfxTally() {
  playTone(1200, 0.05, 'square', 0.12, 0);
}

// =======================================================
// BGM: Synthesized Adventure Music Loop
// =======================================================

let bgmInterval: ReturnType<typeof setInterval> | null = null;
let bgmTimeoutIds: ReturnType<typeof setTimeout>[] = [];

function playBgmNote(freq: number, duration: number, type: OscillatorType, volume: number, delay: number) {
  const ctx = getWebAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  gain.gain.setValueAtTime(0, ctx.currentTime + delay);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.02);
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay + duration * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

function playBgmBar() {
  // Adventure-themed melody pattern — mystical fantasy feel
  // Bar lasts ~4 seconds, with arpeggiated chords + melody line

  const vol = 0.06; // Keep BGM quiet
  const bassVol = 0.04;
  const bpm = 0.25; // each beat = 0.25s

  // Bass drone (sustained)
  playBgmNote(131, 3.8, 'triangle', bassVol, 0);      // C3
  playBgmNote(165, 3.8, 'triangle', bassVol * 0.7, 0); // E3

  // Arpeggio pattern (harp-like)
  const arpNotes = [262, 330, 392, 523, 392, 330, 262, 330, 392, 523, 659, 523, 392, 330, 262, 294];
  arpNotes.forEach((freq, i) => {
    playBgmNote(freq, bpm * 1.5, 'sine', vol, i * bpm);
  });

  // Melody overlay (every other beat, with variation)
  const melodyNotes = [523, 0, 659, 0, 784, 0, 659, 0, 523, 0, 587, 0, 523, 0, 494, 0];
  melodyNotes.forEach((freq, i) => {
    if (freq > 0) {
      playBgmNote(freq, bpm * 2, 'triangle', vol * 0.8, i * bpm);
    }
  });
}

function startBgmLoop() {
  if (bgmInterval) return;
  
  const barDuration = 4000; // 4 seconds per bar
  
  playBgmBar(); // Play immediately
  bgmInterval = setInterval(() => {
    playBgmBar();
  }, barDuration);
}

function stopBgmLoop() {
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
  bgmTimeoutIds.forEach(id => clearTimeout(id));
  bgmTimeoutIds = [];
}

// =======================================================

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const [bgmEnabled, setBgmEnabledState] = useState(false);
  const [sfxEnabled, setSfxEnabledState] = useState(true);
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const sfxEnabledRef = useRef(true);
  const bgmEnabledRef = useRef(false);

  const warningSound = useRef<Audio.Sound | null>(null);
  const tallySound = useRef<Audio.Sound | null>(null);

  // Load settings
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const bgm = await AsyncStorage.getItem('bgmEnabled');
        const sfx = await AsyncStorage.getItem('sfxEnabled');
        if (bgm !== null) {
          const val = bgm === 'true';
          setBgmEnabledState(val);
          bgmEnabledRef.current = val;
        }
        if (sfx !== null) {
          const val = sfx === 'true';
          setSfxEnabledState(val);
          sfxEnabledRef.current = val;
        }
      } catch (e) {}
    };
    loadPrefs();
  }, []);

  // Keep ref in sync
  useEffect(() => {
    sfxEnabledRef.current = sfxEnabled;
  }, [sfxEnabled]);

  useEffect(() => {
    bgmEnabledRef.current = bgmEnabled;
  }, [bgmEnabled]);

  const setBgmEnabled = async (val: boolean) => {
    setBgmEnabledState(val);
    bgmEnabledRef.current = val;
    await AsyncStorage.setItem('bgmEnabled', val.toString());
    if (!val) {
      stopBgmLoop();
      setBgmPlaying(false);
    }
  };

  const setSfxEnabled = async (val: boolean) => {
    setSfxEnabledState(val);
    sfxEnabledRef.current = val;
    await AsyncStorage.setItem('sfxEnabled', val.toString());
  };

  const playBgm = () => {
    if (!bgmEnabledRef.current) return;
    if (Platform.OS === 'web') {
      startBgmLoop();
      setBgmPlaying(true);
    }
  };

  const stopBgm = () => {
    if (Platform.OS === 'web') {
      stopBgmLoop();
      setBgmPlaying(false);
    }
  };

  // ---- PLAY SFX ----
  const playSfx = (type: SfxType) => {
    if (!sfxEnabledRef.current) return;

    if (Platform.OS === 'web') {
      switch (type) {
        case 'complete':    webSfxComplete(); break;
        case 'levelUp':     webSfxLevelUp(); break;
        case 'click':       webSfxClick(); break;
        case 'warning':     webStartWarning(); break;
        case 'lose':        webSfxLose(); break;
        case 'start':       webSfxStart(); break;
        case 'rankUp':      webSfxRankUp(); break;
        case 'rankDown':    webSfxRankDown(); break;
        case 'navigate':    webSfxNavigate(); break;
        case 'winrateUp':   webSfxWinrateUp(); break;
        case 'winrateDown': webSfxWinrateDown(); break;
        default:            webSfxClick(); break;
      }
      return;
    }

    // Native: expo-av
    const nativeUrls: Record<string, string> = {
      complete: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_8e29a97bc8.mp3?filename=level-up-3-199576.mp3',
      lose:     'https://cdn.pixabay.com/download/audio/2021/08/04/audio_c6ccf3232f.mp3?filename=negative_beeps-6008.mp3',
      start:    'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3',
    };
    const uri = nativeUrls[type] ?? nativeUrls.start;
    Audio.Sound.createAsync({ uri }, { shouldPlay: true, volume: 1.0 })
      .then(({ sound }) => {
        sound.setOnPlaybackStatusUpdate((s) => {
          if (s.isLoaded && s.didJustFinish) sound.unloadAsync();
        });
      })
      .catch(() => {});
  };

  // ---- WARNING SFX (looping) ----
  const startWarningSfx = () => {
    if (!sfxEnabledRef.current) return;

    if (Platform.OS === 'web') {
      webStartWarning();
      return;
    }

    (async () => {
      try {
        if (warningSound.current) {
          await warningSound.current.playAsync();
          return;
        }
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2901db78c6.mp3?filename=alert-106511.mp3' },
          { shouldPlay: true, isLooping: true, volume: 1.0, rate: 1.5, shouldCorrectPitch: false }
        );
        warningSound.current = sound;
      } catch (e) {}
    })();
  };

  const stopWarningSfx = () => {
    if (Platform.OS === 'web') {
      webStopWarning();
      return;
    }
    warningSound.current?.stopAsync().catch(() => {});
  };

  // ---- TALLY SFX ----
  const playTallySfx = () => {
    if (!sfxEnabledRef.current) return;
    if (Platform.OS === 'web') {
      webSfxTally();
      return;
    }
    tallySound.current?.playAsync().catch(() => {});
  };

  const stopTallySfx = () => {
    if (Platform.OS !== 'web') {
      tallySound.current?.stopAsync().catch(() => {});
    }
  };

  return (
    <AudioContext.Provider value={{
      bgmEnabled, sfxEnabled,
      setBgmEnabled, setSfxEnabled,
      playSfx, startWarningSfx, stopWarningSfx,
      playTallySfx, stopTallySfx,
      playBgm, stopBgm, bgmPlaying,
    }}>
      {children}
    </AudioContext.Provider>
  );
};
