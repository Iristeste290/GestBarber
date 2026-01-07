// Simple notification sound using Web Audio API
let audioContext: AudioContext | null = null;

const NOTIFICATION_SOUND_KEY = 'notification_sound_enabled';

export const isNotificationSoundEnabled = (): boolean => {
  const stored = localStorage.getItem(NOTIFICATION_SOUND_KEY);
  return stored === null ? true : stored === 'true';
};

export const setNotificationSoundEnabled = (enabled: boolean): void => {
  localStorage.setItem(NOTIFICATION_SOUND_KEY, String(enabled));
};

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const playNotificationSound = (type: 'gentle' | 'urgent' = 'gentle') => {
  // Check if sounds are enabled
  if (!isNotificationSoundEnabled()) {
    return;
  }

  try {
    const ctx = getAudioContext();
    
    // Resume context if suspended (required for autoplay policies)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'urgent') {
      // Two-tone urgent notification (like a doorbell)
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.15); // E5
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.3); // A5
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } else {
      // Gentle chime notification
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    }

    oscillator.type = 'sine';
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
};

// Play a double chime for "appointment now" alerts
export const playUrgentNotificationSound = () => {
  playNotificationSound('urgent');
  
  // Play second chime after a short delay
  setTimeout(() => {
    playNotificationSound('urgent');
  }, 600);
};
