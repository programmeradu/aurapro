/**
 * 🔊 Voice Guidance Service
 * Comprehensive voice navigation system with Ghana-specific language support
 */

interface TurnInstruction {
  id: string
  type: 'turn-left' | 'turn-right' | 'straight' | 'slight-left' | 'slight-right' | 'sharp-left' | 'sharp-right' | 'u-turn' | 'arrive' | 'depart'
  instruction: string
  distance: number
  duration: number
  coordinates: [number, number]
  street_name?: string
  landmark?: string
  maneuver_type?: string
}

interface VoiceSettings {
  enabled: boolean
  language: 'en-US' | 'en-GB' | 'en-GH'
  rate: number
  pitch: number
  volume: number
  useLocalTerms: boolean
  announceDistance: boolean
  announceTraffic: boolean
}

class VoiceGuidanceService {
  private settings: VoiceSettings
  private synthesis: SpeechSynthesis | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private isSupported: boolean = false
  private voices: SpeechSynthesisVoice[] = []

  constructor() {
    this.settings = {
      enabled: true,
      language: 'en-GH',
      rate: 0.8,
      pitch: 1.0,
      volume: 0.8,
      useLocalTerms: true,
      announceDistance: true,
      announceTraffic: true
    }

    this.initializeVoiceService()
  }

  private initializeVoiceService() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis
      this.isSupported = true
      
      // Load available voices
      this.loadVoices()
      
      // Listen for voice changes
      this.synthesis.addEventListener('voiceschanged', () => {
        this.loadVoices()
      })
    }
  }

  private loadVoices() {
    if (!this.synthesis) return
    
    this.voices = this.synthesis.getVoices()
    console.log('Available voices:', this.voices.map(v => `${v.name} (${v.lang})`))
  }

  private getPreferredVoice(): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) return null

    // Prefer English voices with natural sound
    const preferredVoices = [
      // Ghana English or African English if available
      this.voices.find(v => v.lang.includes('en-GH') || v.name.toLowerCase().includes('ghana')),
      // British English (closer to Ghana English)
      this.voices.find(v => v.lang.includes('en-GB') && (v.name.includes('Google') || v.name.includes('Microsoft'))),
      // US English as fallback
      this.voices.find(v => v.lang.includes('en-US') && (v.name.includes('Google') || v.name.includes('Microsoft'))),
      // Any English voice
      this.voices.find(v => v.lang.startsWith('en')),
      // Default voice
      this.voices[0]
    ]

    return preferredVoices.find(v => v !== undefined) || null
  }

  /**
   * Convert instruction to Ghana-appropriate language
   */
  private localizeInstruction(instruction: TurnInstruction): string {
    if (!this.settings.useLocalTerms) {
      return instruction.instruction
    }

    let localizedText = instruction.instruction

    // Ghana-specific transport terms
    const localTerms = {
      'bus stop': 'lorry station',
      'bus station': 'lorry station', 
      'taxi rank': 'taxi station',
      'roundabout': 'circle',
      'traffic light': 'traffic light',
      'junction': 'junction',
      'road': 'road',
      'street': 'street',
      'avenue': 'avenue',
      'highway': 'highway'
    }

    // Replace terms
    Object.entries(localTerms).forEach(([english, local]) => {
      localizedText = localizedText.replace(new RegExp(english, 'gi'), local)
    })

    // Add Ghana-specific landmarks context
    if (instruction.landmark) {
      const landmarkContext = this.getGhanaLandmarkContext(instruction.landmark)
      if (landmarkContext) {
        localizedText += `. ${landmarkContext}`
      }
    }

    // Add distance information if enabled
    if (this.settings.announceDistance && instruction.distance > 0) {
      const distanceText = this.formatDistanceForSpeech(instruction.distance)
      localizedText += `. ${distanceText}`
    }

    return localizedText
  }

  private getGhanaLandmarkContext(landmark: string): string | null {
    const landmarkLower = landmark.toLowerCase()
    
    // Common Ghana landmarks and their context
    const contexts = {
      'circle': 'You will see the overhead bridge',
      'kaneshie': 'Look for the market area',
      'tema': 'You are heading towards the port area',
      'accra mall': 'The shopping center will be visible',
      'independence square': 'You will see the Black Star Gate',
      'kotoka airport': 'Follow signs to the airport terminal',
      'makola market': 'You will see the busy market area',
      'osu castle': 'The castle is near the coast',
      'national theatre': 'Look for the distinctive building design'
    }

    for (const [key, context] of Object.entries(contexts)) {
      if (landmarkLower.includes(key)) {
        return context
      }
    }

    return null
  }

  private formatDistanceForSpeech(meters: number): string {
    if (meters < 100) {
      return `In ${Math.round(meters / 10) * 10} meters`
    } else if (meters < 1000) {
      return `In ${Math.round(meters / 50) * 50} meters`
    } else {
      const km = meters / 1000
      if (km < 2) {
        return `In ${km.toFixed(1)} kilometers`
      } else {
        return `In ${Math.round(km)} kilometers`
      }
    }
  }

  /**
   * Speak an instruction
   */
  public speak(instruction: TurnInstruction): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported || !this.settings.enabled) {
        resolve()
        return
      }

      // Stop any current speech
      this.stop()

      const text = this.localizeInstruction(instruction)
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Configure utterance
      utterance.rate = this.settings.rate
      utterance.pitch = this.settings.pitch
      utterance.volume = this.settings.volume
      
      // Set preferred voice
      const preferredVoice = this.getPreferredVoice()
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      // Event handlers
      utterance.onend = () => {
        this.currentUtterance = null
        resolve()
      }

      utterance.onerror = (event) => {
        this.currentUtterance = null
        console.error('Speech synthesis error:', event.error)
        reject(new Error(`Speech synthesis failed: ${event.error}`))
      }

      utterance.onstart = () => {
        console.log('Speaking:', text)
      }

      // Store current utterance
      this.currentUtterance = utterance

      // Speak
      this.synthesis?.speak(utterance)
    })
  }

  /**
   * Speak a custom message
   */
  public speakMessage(message: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported || !this.settings.enabled) {
        resolve()
        return
      }

      this.stop()

      const utterance = new SpeechSynthesisUtterance(message)
      utterance.rate = this.settings.rate
      utterance.pitch = this.settings.pitch
      utterance.volume = this.settings.volume

      const preferredVoice = this.getPreferredVoice()
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onend = () => {
        this.currentUtterance = null
        resolve()
      }

      utterance.onerror = (event) => {
        this.currentUtterance = null
        reject(new Error(`Speech synthesis failed: ${event.error}`))
      }

      this.currentUtterance = utterance
      this.synthesis?.speak(utterance)
    })
  }

  /**
   * Stop current speech
   */
  public stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel()
      this.currentUtterance = null
    }
  }

  /**
   * Pause current speech
   */
  public pause(): void {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.pause()
    }
  }

  /**
   * Resume paused speech
   */
  public resume(): void {
    if (this.synthesis && this.synthesis.paused) {
      this.synthesis.resume()
    }
  }

  /**
   * Check if currently speaking
   */
  public isSpeaking(): boolean {
    return this.synthesis?.speaking || false
  }

  /**
   * Update voice settings
   */
  public updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
  }

  /**
   * Get current settings
   */
  public getSettings(): VoiceSettings {
    return { ...this.settings }
  }

  /**
   * Check if voice synthesis is supported
   */
  public isVoiceSupported(): boolean {
    return this.isSupported
  }

  /**
   * Get available voices
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return [...this.voices]
  }

  /**
   * Test voice with sample text
   */
  public testVoice(): Promise<void> {
    const testMessage = "Welcome to AURA transport navigation. Voice guidance is working properly."
    return this.speakMessage(testMessage)
  }

  /**
   * Announce navigation start
   */
  public announceNavigationStart(destination: string): Promise<void> {
    const message = `Starting navigation to ${destination}. Voice guidance is enabled. Drive safely.`
    return this.speakMessage(message)
  }

  /**
   * Announce navigation end
   */
  public announceNavigationEnd(): Promise<void> {
    const message = "You have arrived at your destination. Navigation complete."
    return this.speakMessage(message)
  }

  /**
   * Announce traffic alert
   */
  public announceTrafficAlert(alert: string): Promise<void> {
    if (!this.settings.announceTraffic) return Promise.resolve()
    
    const message = `Traffic alert: ${alert}`
    return this.speakMessage(message)
  }
}

// Export singleton instance
export const voiceGuidanceService = new VoiceGuidanceService()
export type { VoiceSettings, TurnInstruction }
