'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { VoiceInput } from '@/components/VoiceInput'
import { ChatMessage } from '@/components/ChatMessage'
import { LoadingIndicator } from '@/components/LoadingIndicator'
import { Message } from '@/types'
import { Volume2 } from 'lucide-react'

// EDIT 1: Renamed SYSTEM_PROMPT to INITIAL_SYSTEM_PROMPT for clarity.
// This constant holds the initial state of the system prompt.
const INITIAL_SYSTEM_PROMPT = `You are Barnaby Goodbarrel, a cheerful but slightly gruff halfling innkeeper who runs 'The Rusty Flagon' tavern in the small town of Millbrook. You are currently behind the bar, polishing a mug with a well-worn cloth.

PERSONALITY & TRAITS:
- Generally friendly and welcoming, but with a gruff exterior that hides a warm heart
- A bit gossipy and loves sharing local rumors and news
- Concerned about the safety of travelers on the roads outside town
- Has a slight rural accent and uses colloquial expressions
- Proud of your establishment and the quality of your ale and mutton stew
- Sometimes makes observations about the weather or the state of business
- Has been running the tavern for over 20 years

KNOWLEDGE & TOPICS:
- Local rumors: strange lights in the Whispering Woods, merchant caravans arriving late
- The roads: mentions of increased goblin activity on the north road
- Your tavern: serves excellent ale, hearty mutton stew, has rooms upstairs for travelers
- The town: small farming community, mostly peaceful, has a blacksmith named Gareth
- Simple quest hooks: missing merchant's daughter, haunted mill, or strange noises from the old watchtower

SPEAKING STYLE:
- Uses phrases like "Well now," "Right then," "Aye," and "Mind you"
- Sometimes drops 'g' from words ending in '-ing' (workin', thinkin', etc.)
- Refers to customers as "friend," "traveler," or "stranger"
- Keep responses conversational and not too long (2-4 sentences typically)

Respond naturally and stay in character. You're having a casual conversation with a patron who just walked into your tavern.`


export default function Home() {
    const [messages, setMessages] = useState<Message[]>([])
    const [isThinking, setIsThinking] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    // EDIT 2: Initialized currentSystemPrompt with INITIAL_SYSTEM_PROMPT.
    // This state variable will now hold the mutable system prompt.
    const [currentSystemPrompt, setCurrentSystemPrompt] = useState<string>(INITIAL_SYSTEM_PROMPT)
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const audioRef = useRef<HTMLAudioElement>(null)

    // Initialize with the welcome message only on the client side
    useEffect(() => {
        if (!isInitialized) {
            const welcomeMessage: Message = {
                id: '1',
                role: 'assistant',
                content: "Well now, welcome to The Rusty Flagon! I'm Barnaby, and this here's my tavern. Just polishin' up some mugs, I was. What brings you to Millbrook, friend? Looking for a room, or perhaps some of my famous mutton stew?",
                timestamp: new Date(),
            }
            setMessages([welcomeMessage])
            setIsInitialized(true)
        }
    }, [isInitialized])

    useEffect(() => {
        // Auto-scroll to bottom when new messages are added
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight
            }
        }
    }, [messages, isThinking])

    const playAudio = async (text: string) => {
        setIsSpeaking(true)
        try {
            const response = await fetch('/api/text-to-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            })

            if (response.ok) {
                const audioBlob = await response.blob()
                const audioUrl = URL.createObjectURL(audioBlob)

                if (audioRef.current) {
                    audioRef.current.src = audioUrl
                    audioRef.current.onended = () => {
                        setIsSpeaking(false)
                        URL.revokeObjectURL(audioUrl)
                    }
                    await audioRef.current.play()
                }
            }
        } catch (error) {
            console.error('Error playing audio:', error)
            setIsSpeaking(false)
        }
    }

    const handleTranscription = async (text: string) => {
        if (!text.trim()) return

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date(),
        }
        setMessages(prev => [...prev, userMessage])
        setIsThinking(true)

        try {
            // Send to chat API, including the currentSystemPrompt
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: text,
                    conversationHistory: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    systemPrompt: currentSystemPrompt // EDIT 3: Sending the dynamic currentSystemPrompt to the API.
                }),
            })

            if (response.ok) {
                // EDIT 4: Destructuring the structured response from the API.
                // We now expect 'response' (the actual AI message) and 'newSystemPrompt' (the update).
                const { response: aiResponseContent, newSystemPrompt } = await response.json()

                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    // EDIT 5: Using aiResponseContent for the message content.
                    content: aiResponseContent,
                    timestamp: new Date(),
                }

                setMessages(prev => [...prev, assistantMessage])

                // EDIT 6: Conditionally updating the system prompt.
                // If the API returns a newSystemPrompt, update the state.
                if (newSystemPrompt) {
                    // This appends the new prompt fragment. You might adjust this logic
                    // based on how you want the system prompt to evolve (e.g., replace, insert).
                    setCurrentSystemPrompt(prevPrompt => `${prevPrompt}\n\n${newSystemPrompt}`)
                }

                // EDIT 7: Using aiResponseContent for audio playback.
                await playAudio(aiResponseContent)
            } else {
                throw new Error('Failed to get response')
            }
        } catch (error) {
            console.error('Error sending message:', error)
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Ah, sorry friend, seems I'm havin' trouble hearin' ya properly. Mind tryin' again?",
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsThinking(false)
        }
    }

    const replayLastMessage = () => {
        const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')
        if (lastAssistantMessage && !isSpeaking) {
            playAudio(lastAssistantMessage.content)
        }
    }

    // Show loading state while initializing to prevent hydration mismatch
    if (!isInitialized) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-6">
                        <h1 className="text-4xl font-bold text-amber-900 mb-2">
                            The Rusty Flagon Tavern
                        </h1>
                        <p className="text-amber-700">
                            Loading...
                        </p>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-bold text-amber-900 mb-2">
                        The Rusty Flagon Tavern
                    </h1>
                    <p className="text-amber-700">
                        Chat with Barnaby the Halfling Innkeeper
                    </p>
                </div>

                {/* Main Chat Interface */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Conversation with Barnaby</span>
                            <Button
                                onClick={replayLastMessage}
                                disabled={isSpeaking || messages.length === 0}
                                variant="outline"
                                size="sm"
                            >
                                <Volume2 className="h-4 w-4 mr-1" />
                                {isSpeaking ? 'Playing...' : 'Replay'}
                            </Button>
                        </CardTitle>
                        <CardDescription>
                            Use the microphone button below to speak with Barnaby. He'll respond both in text and voice.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Chat Messages */}
                        <ScrollArea className="h-96 w-full pr-4" ref={scrollAreaRef}>
                            <div className="space-y-4">
                                {messages.map((message) => (
                                    <ChatMessage key={message.id} message={message} />
                                ))}

                                {isThinking && (
                                    <LoadingIndicator message="Barnaby is thinking..." />
                                )}
                            </div>
                        </ScrollArea>

                        {/* Voice Input */}
                        <div className="mt-6 pt-4 border-t">
                            <VoiceInput
                                onTranscription={handleTranscription}
                                disabled={isThinking || isSpeaking}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Information Panel */}
                <Card>
                    <CardHeader>
                        <CardTitle>About Barnaby & The Rusty Flagon</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <h4 className="font-semibold text-amber-800 mb-2">The Innkeeper</h4>
                                <p className="text-amber-700">
                                    Barnaby Goodbarrel is a friendly halfling who has been running The Rusty Flagon
                                    for over 20 years. He's known for his excellent ale, hearty mutton stew, and
                                    knowledge of local happenings.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-amber-800 mb-2">The Tavern</h4>
                                <p className="text-amber-700">
                                    Located in the peaceful farming town of Millbrook, The Rusty Flagon serves
                                    as a gathering place for locals and a safe haven for weary travelers.
                                    Ask Barnaby about local rumors, the roads, or current events.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Audio element for playing TTS */}
                <audio ref={audioRef} style={{ display: 'none' }} />
            </div>
        </main>
    )

}
