import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { isNativePlatform } from './LocationService';

export const initAudio = async () => {
  // SpeechSynthesis usually doesn't need explicit initialization on web 
  // like AudioContext does, but we can use this to resume suspended 
  // audio contexts or check permissions if needed in the future.
  if (!isNativePlatform() && 'speechSynthesis' in window) {
    // Some browsers require a dummy utterance to 'unlock' audio
    const utterance = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(utterance);
  }
};

export const speak = async (text) => {
  if (isNativePlatform()) {
    try {
      await TextToSpeech.speak({
        text,
        lang: 'zh-TW',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
      });
    } catch (e) {
      console.error("Capacitor TTS Error:", e);
    }
  } else {
    // Web Fallback
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-TW';
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Speech Synthesis not supported");
    }
  }
};
