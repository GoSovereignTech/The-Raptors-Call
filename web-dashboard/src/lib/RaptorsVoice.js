
/**
 * lib/RaptorsVoice.js  
 * usage 
 * const rv = RaptorsVoice(); 
 * rv.speak(text, interrupt = true);
 *  
 */
// lib/RaptorsVoice.js
class RaptorsVoice {
  constructor() {
    this.synth = window.speechSynthesis;
    this.isSupported = 'speechSynthesis' in window;
    this.voice = null;
    
    if (this.isSupported) {
      this.loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
      }
    }
  }

  loadVoices() {
    const voices = this.synth.getVoices();
    this.voice = voices.find(v => v.lang === 'en-US') || voices[0];
  }

  // This Promise is critical. It tells messageCenter exactly when to move to the next message.
  speakAndWait(text) {
    return new Promise((resolve) => {
      if (!this.isSupported || !text) return resolve();

      

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) utterance.voice = this.voice;
      utterance.rate = 1.1; 

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve(); // Prevents freezing if browser blocks audio

      this.synth.speak(utterance);
    });
  }

  stop() {
    if (this.isSupported) {
      this.synth.cancel();
    }
  }
}

export const raptorVoice = new RaptorsVoice();