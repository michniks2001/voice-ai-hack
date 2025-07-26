export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    characterId: 'user' | 'barnaby' | 'gareth'
    characterName: string
}

export interface VoiceRecordingState {
    isRecording: boolean
    isProcessing: boolean
    error: string | null
}
