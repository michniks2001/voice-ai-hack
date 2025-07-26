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

// --- NEW: NPC data defined on the frontend ---
// This object holds the client-side information for each character.
const npcData = {
    barnaby: {
        name: "Barnaby Goodbarrel",
        voiceId: process.env.NEXT_PUBLIC_BARNABY_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
        greeting: "Well now, welcome to The Rusty Flagon! What brings you to Millbrook, friend?",
        description: "Barnaby is a friendly halfling who has been running The Rusty Flagon for over 20 years. He's known for his excellent ale, hearty mutton stew, and knowledge of local happenings."
    },
    gareth: {
        name: "Gareth the Blacksmith",
        // IMPORTANT: Replace this with the actual ElevenLabs Voice ID for Gareth
        voiceId: process.env.NEXT_PUBLIC_GARETH_VOICE_ID || "pNInz6obpgDQGcFmaJgB",
        greeting: "Hmph. Another traveler. The name's Gareth. I forge steel and guide folks through the Whispering Woods, for a price. What do you need? Speak up.",
        description: "Gareth is the stoic and pragmatic blacksmith of Millbrook. He is the most experienced guide for the dangerous Whispering Woods and is wary of its goblins and spirits."
    }
};

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([])
    const [isThinking, setIsThinking] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)

    // --- NEW: State to manage the active character ---
    const [activeCharacterId, setActiveCharacterId] = useState<'barnaby' | 'gareth'>('barnaby')

    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const audioRef = useRef<HTMLAudioElement>(null)

    // --- MODIFIED: useEffect to initialize and reset chat for the active character ---
    useEffect(() => {
        // This effect runs when the component first loads and whenever activeCharacterId changes.
        const character = npcData[activeCharacterId];
        const welcomeMessage: Message = {
            id: '1',
            role: 'assistant',
            content: character.greeting,
            timestamp: new Date(),
            characterId: activeCharacterId,
            characterName: character.name,
        };
        setMessages([welcomeMessage]);

        if (!isInitialized) {
            setIsInitialized(true);
        }
    }, [activeCharacterId]); // Reruns when the character is switched

    useEffect(() => {
        // Auto-scroll to bottom when new messages are added
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages, isThinking]);

    // --- MODIFIED: playAudio now accepts a voiceId ---
    const playAudio = async (text: string, voiceId: string) => {
        setIsSpeaking(true);
        try {
            const response = await fetch('/api/text-to-speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voiceId }), // Pass the specific voiceId
            });

            if (response.ok) {
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);

                if (audioRef.current) {
                    audioRef.current.src = audioUrl;
                    audioRef.current.onended = () => {
                        setIsSpeaking(false);
                        URL.revokeObjectURL(audioUrl);
                    };
                    await audioRef.current.play();
                }
            } else {
                throw new Error('Failed to fetch audio');
            }
        } catch (error) {
            console.error('Error playing audio:', error);
            setIsSpeaking(false);
        }
    };

    // --- MODIFIED: handleTranscription sends characterId and handles character-specific data ---
    const handleTranscription = async (text: string) => {
        if (!text.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date(),
            characterId: 'user',
            characterName: 'You',
        };
        setMessages(prev => [...prev, userMessage]);
        setIsThinking(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    conversationHistory: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    characterId: activeCharacterId, // Send the active character ID to the backend
                }),
            });

            if (response.ok) {
                const { aiResponse } = await response.json(); // Simpler destructuring
                const character = npcData[activeCharacterId];

                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: aiResponse,
                    timestamp: new Date(),
                    characterId: activeCharacterId,
                    characterName: character.name,
                };
                setMessages(prev => [...prev, assistantMessage]);

                // Play audio with the correct character's voice
                await playAudio(aiResponse, character.voiceId);
            } else {
                throw new Error('Failed to get response from chat API');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Ah, sorry friend, seems my mind's a bit fuzzy right now. Try me again in a moment.",
                timestamp: new Date(),
                characterId: activeCharacterId,
                characterName: npcData[activeCharacterId].name,
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsThinking(false);
        }
    };

    // --- MODIFIED: replayLastMessage gets voiceId from the message's character data ---
    const replayLastMessage = () => {
        const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
        if (lastAssistantMessage && !isSpeaking) {
            const character = npcData[lastAssistantMessage.characterId as keyof typeof npcData];
            if (character) {
                playAudio(lastAssistantMessage.content, character.voiceId);
            }
        }
    };

    // --- NEW: Function to handle switching characters ---
    const handleCharacterSelect = (characterId: 'barnaby' | 'gareth') => {
        if (characterId !== activeCharacterId) {
            setActiveCharacterId(characterId);
        }
    };

    if (!isInitialized) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex items-center justify-center">
                <LoadingIndicator message="Warming up the tavern..." />
            </main>
        )
    }

    const activeCharacter = npcData[activeCharacterId];

    return (
        <main className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-bold text-amber-900 mb-2">The Mystery of the Whispering Woods</h1>
                    <p className="text-amber-700">A Voice in the Village of Millbrook</p>
                </div>

                {/* --- NEW: Character Selection UI --- */}
                <div className="flex justify-center gap-4 mb-6">
                    <Button
                        onClick={() => handleCharacterSelect('barnaby')}
                        variant={activeCharacterId === 'barnaby' ? 'default' : 'outline'}
                    >
                        Talk to Barnaby (Innkeeper)
                    </Button>
                    <Button
                        onClick={() => handleCharacterSelect('gareth')}
                        variant={activeCharacterId === 'gareth' ? 'default' : 'outline'}
                    >
                        Talk to Gareth (Blacksmith)
                    </Button>
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        {/* --- MODIFIED: Dynamic Title --- */}
                        <CardTitle className="flex items-center justify-between">
                            <span>Conversation with {activeCharacter.name}</span>
                            <Button
                                onClick={replayLastMessage}
                                disabled={isSpeaking || messages.length <= 1}
                                variant="outline"
                                size="sm"
                            >
                                <Volume2 className="h-4 w-4 mr-1" />
                                {isSpeaking ? 'Playing...' : 'Replay'}
                            </Button>
                        </CardTitle>
                        <CardDescription>
                            Use the microphone button below to speak with {activeCharacter.name}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-96 w-full pr-4" ref={scrollAreaRef}>
                            <div className="space-y-4">
                                {messages.map((message) => (
                                    <ChatMessage key={message.id} message={message} />
                                ))}
                                {isThinking && (
                                    <LoadingIndicator message={`${activeCharacter.name} is thinking...`} />
                                )}
                            </div>
                        </ScrollArea>
                        <div className="mt-6 pt-4 border-t">
                            <VoiceInput
                                onTranscription={handleTranscription}
                                disabled={isThinking || isSpeaking}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        {/* --- MODIFIED: Dynamic Info Panel --- */}
                        <CardTitle>About {activeCharacter.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-amber-700">
                            {activeCharacter.description}
                        </p>
                    </CardContent>
                </Card>

                <audio ref={audioRef} style={{ display: 'none' }} />
            </div>
        </main>
    );
}
