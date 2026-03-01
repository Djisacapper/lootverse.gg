import { useRef } from 'react';

// Audio context for generating tones
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const playSound = (frequency, duration, type = 'sine') => {
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (e) {
    console.error('Audio error:', e);
  }
};

export function useAudio() {
  const audioRef = useRef(null);

  const playRollingSound = () => {
    try {
      // Create looping rolling sound (low frequency modulation)
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const lfo = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      
      // LFO modulates the frequency
      lfo.frequency.value = 8; // 8Hz wobble
      lfoGain.gain.value = 50; // Frequency modulation depth
      
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0.03, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.04, audioContext.currentTime + 0.2);
      
      lfo.start();
      oscillator.start();
      
      // Store refs for stopping later
      audioRef.current = { oscillator, gainNode, lfo };
      
      return () => {
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        setTimeout(() => {
          oscillator.stop();
          lfo.stop();
        }, 100);
      };
    } catch (e) {
      console.error('Rolling sound error:', e);
      return () => {};
    }
  };

  const stopRollingSound = () => {
    if (audioRef.current) {
      try {
        const { oscillator, gainNode, lfo } = audioRef.current;
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        setTimeout(() => {
          oscillator.stop();
          lfo.stop();
        }, 100);
      } catch (e) {
        console.error('Stop sound error:', e);
      }
      audioRef.current = null;
    }
  };

  const playDingSound = () => {
    // High bell-like ding sound
    playSound(800, 0.3, 'sine');
    playSound(1200, 0.25, 'sine');
  };

  return { playRollingSound, stopRollingSound, playDingSound };
}