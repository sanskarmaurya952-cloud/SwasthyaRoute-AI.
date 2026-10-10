export interface SpeechState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  language: string;
}

export class SpeechService {
  private recognition: any = null;
  private isSupported: boolean = false;
  private onStateChangeCallback: ((state: SpeechState) => void) | null = null;
  private state: SpeechState = {
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    isSupported: false,
    language: 'hi-IN',
  };

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRec =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition ||
        (window as any).mozSpeechRecognition ||
        (window as any).msSpeechRecognition;

      if (SpeechRec) {
        this.isSupported = true;
        this.state.isSupported = true;
        try {
          this.recognition = new SpeechRec();
          this.recognition.continuous = true;
          this.recognition.interimResults = true;
          this.recognition.lang = 'hi-IN';

          this.recognition.onstart = () => {
            this.updateState({ isListening: true, error: null });
          };

          this.recognition.onresult = (event: any) => {
            let final = '';
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                final += event.results[i][0].transcript;
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            if (final) {
              this.updateState({
                transcript: (this.state.transcript ? this.state.transcript + ' ' : '') + final,
                interimTranscript: interim,
              });
            } else {
              this.updateState({ interimTranscript: interim });
            }
          };

          this.recognition.onerror = (event: any) => {
            console.warn('Speech recognition error:', event.error);
            this.updateState({
              isListening: false,
              error: `Microphone issue: ${event.error}. You can type manually.`,
            });
          };

          this.recognition.onend = () => {
            this.updateState({ isListening: false, interimTranscript: '' });
          };
        } catch (e: any) {
          console.warn('Speech recognition init failed:', e);
          this.state.error = 'Speech recognition initialization failed in this browser.';
        }
      } else {
        this.state.error = 'Browser Web Speech API is not supported. Use the text input fallback.';
      }
    }
  }

  public subscribe(callback: (state: SpeechState) => void) {
    this.onStateChangeCallback = callback;
    callback(this.state);
  }

  private updateState(partial: Partial<SpeechState>) {
    this.state = { ...this.state, ...partial };
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.state);
    }
  }

  public setLanguage(lang: string) {
    this.state.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
    this.updateState({ language: lang });
  }

  public startListening() {
    if (!this.isSupported || !this.recognition) {
      this.updateState({
        error: 'Speech recognition is not supported in this browser. Please enter symptoms via text.',
      });
      return;
    }
    try {
      this.updateState({ error: null, interimTranscript: '' });
      this.recognition.start();
    } catch (err: any) {
      console.warn('Error starting speech:', err);
    }
  }

  public stopListening() {
    if (this.recognition && this.state.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('Error stopping speech:', err);
      }
    }
  }

  public setTranscript(text: string) {
    this.updateState({ transcript: text, interimTranscript: '' });
  }

  public clearTranscript() {
    this.updateState({ transcript: '', interimTranscript: '', error: null });
  }

  public speakFeedback(text: string, lang: string = 'hi-IN') {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis failed:', err);
      }
    }
  }
}

export const speechService = new SpeechService();
