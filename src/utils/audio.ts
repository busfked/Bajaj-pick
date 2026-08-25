/**
 * Web Audio & Speech Notification System
 * Polite, listenable, and customizable ringtones for Bajaj Drivers & Passengers
 */

import { DriverRingtoneOption, AppLanguage } from '../types';

let audioCtx: AudioContext | null = null;
let ringInterval: number | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. Play Voice Speech ("Bajaj! Bajaj! Bajaj!")
function speakVoiceAlert(lang: AppLanguage | string = 'en') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel(); // cancel prior speech
    const text = lang === 'am' ? 'ባጃጅ! ባጃጅ! አዲስ ኮንትራት ጉዞ መጥቷል!' : 'Bajaj! Bajaj! Bajaj! New contrat trip!';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.15;
    utterance.volume = 0.9;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech errors
  }
}

// 2. Play Melodic Village Chime (Warm Pentatonic Marimba)
function playMelodicChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Pentatonic scale (C5, D5, E5, G5, A5)
    const frequencies = [523.25, 587.33, 659.25, 783.99, 880.0];
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.01, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.5);
    });
  } catch {
    // Audio context fallback
  }
}

// 3. Play Subtle Radar Pulse (Clean Sonar Tone)
function playSubtlePulse() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.38);
  } catch {
    // Audio context fallback
  }
}

// Stop any currently playing audio interval
export function stopRingSound(): void {
  if (ringInterval !== null) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}

// Main Driver Ring Trigger
export function startDriverAlertSound(
  option: DriverRingtoneOption = 'bajaj_voice',
  lang: AppLanguage | string = 'en'
): void {
  stopRingSound();

  const triggerSound = () => {
    if (option === 'bajaj_voice') {
      playSubtlePulse();
      setTimeout(() => speakVoiceAlert(lang), 300);
    } else if (option === 'village_chime') {
      playMelodicChime();
    } else {
      playSubtlePulse();
    }
  };

  // Play immediately
  triggerSound();
  // Repeat politely every 4.5 seconds (not disturbing continuous noise)
  ringInterval = window.setInterval(triggerSound, 4500);
}

// Test / Preview single shot
export function previewRingtone(
  option: DriverRingtoneOption,
  lang: AppLanguage | string = 'en'
): void {
  if (option === 'bajaj_voice') {
    playSubtlePulse();
    setTimeout(() => speakVoiceAlert(lang), 250);
  } else if (option === 'village_chime') {
    playMelodicChime();
  } else {
    playSubtlePulse();
  }
}

// Passenger single confirmation chime (Non-disturbing, plays only once)
export function playPassengerRequestChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.setValueAtTime(880.0, now + 0.15); // A5

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch {
    // Audio fallback
  }
}

// Driver Acceptance Chime (Happy Major Triad)
export function playAcceptChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.01, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  } catch {
    // Audio context fallback
  }
}

// Driver Missed / Fast pickup by another driver
export function playDriverMissedChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(330, now + 0.3);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch {
    // Fallback
  }
}

export function playIncomingRideRing(): void {
  startDriverAlertSound('village_chime');
}
