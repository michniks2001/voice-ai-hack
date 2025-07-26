# D&D Voice NPC - Barnaby the Innkeeper

A voice-enabled conversational AI application featuring Barnaby Goodbarrel, a halfling innkeeper from The Rusty Flagon tavern. Built with Next.js, featuring speech-to-text and text-to-speech capabilities powered by ElevenLabs.

## Features

- 🎤 **Voice Input**: Record your voice and have it transcribed using ElevenLabs Speech-to-Text
- 🔊 **Voice Output**: Barnaby responds with both text and synthesized speech using ElevenLabs Text-to-Speech
- 💬 **Conversational AI**: Powered by OpenAI's GPT-3.5-turbo with a detailed character prompt
- 🎭 **Character Consistency**: Barnaby maintains his personality, accent, and knowledge throughout conversations
- 📱 **Responsive UI**: Built with Tailwind CSS and Shadcn UI components
- 🔄 **Audio Replay**: Replay Barnaby's last message if you missed it

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Voice AI**: ElevenLabs (Speech-to-Text & Text-to-Speech)
- **Language Model**: OpenAI GPT-3.5-turbo
- **Audio**: Web Audio API for recording

## Setup Instructions

### Prerequisites

1. **Node.js** (version 18 or higher)
2. **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/)
3. **ElevenLabs API Key** - Get one from [ElevenLabs](https://elevenlabs.io/)

### Installation

1. **Create a new Next.js project:**
   ```bash
   npx create-next-app@latest dnd-voice-npc --typescript --tailwind --eslint --app
   cd dnd-voice-npc
   ```

2. **Install dependencies:**
   ```bash
   npm install @radix-ui/react-dialog @radix-ui/react-scroll-area @radix-ui/react-slot class-variance-authority clsx lucide-react tailwind-merge tailwindcss-animate
   ```

3. **Copy all the code files** from this artifact into your project, maintaining the directory structure.

4. **Set up environment variables:**
   Create a `.env.local` file in your project root:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
   ```

5. **Choose an ElevenLabs Voice:**
   - Visit [ElevenLabs Voices](https://elevenlabs.io/voice-library)
   - Find a voice that fits Barnaby's character (male, friendly, perhaps with a slight accent)
   - Copy the Voice ID and update your `.env.local` file
   - The default voice ID provided is "Adam" which works well for Barnaby

### Running the Application

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to `http://localhost:3000`

3. **Grant microphone permissions** when prompted by your browser

### Usage

1. **Click the "Start Recording" button** and speak your message
2. **Click "Stop Recording"** when you're done speaking
3. **Wait for transcription and AI processing** - Barnaby will think about your message
4. **Listen to Barnaby's response** - both text and audio will be provided
5. **Use the "Replay" button** to hear Barnaby's last response again

### Customization

#### Modifying Barnaby's Character
Edit the `SYSTEM_PROMPT` in `app/api/chat/route.ts` to change Barnaby's personality, knowledge, or speaking style.

#### Changing the Voice
Update the `ELEVENLABS_VOICE_ID` in your `.env.local` file with a different voice ID from ElevenLabs.

#### Adjusting Voice Settings
Modify the voice settings in `app/api/text-to-speech/route.ts`:
```typescript
voice_settings: {
  stability: 0.5,        // 0.0 to 1.0 - lower = more expressive
  similarity_boost: 0.8, // 0.0 to 1.0 - higher = more similar to original
  style: 0.2,           // 0.0 to 1.0 - adds style variation
  use_speaker_boost: true
}
```

## API Endpoints

- `POST /api/chat` - Processes chat messages with OpenAI
- `POST /api/speech-to-text` - Transcribes audio using ElevenLabs
- `POST /api/text-to-speech` - Generates speech using ElevenLabs

## Troubleshooting

### Common Issues

1. **Microphone not working**: Ensure your browser has microphone permissions
2. **API errors**: Check that your API keys are correctly set in `.env.local`
3. **Audio not playing**: Check browser audio permissions and volume settings
4. **Voice not loading**: Verify the ElevenLabs Voice ID is correct

### Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: May require user interaction before audio playback

## Expanding the Application

### Adding More NPCs
1. Create new API routes for different characters
2. Modify the system prompt for each character
3. Use different ElevenLabs voices for each NPC

### Adding Visual Elements
1. Add character portraits using Next.js Image component
2. Create animated backgrounds or tavern scenes
3. Add sound effects for ambiance

### Enhanced Features
1. **Memory**: Store conversation history in a database
2. **Quests**: Implement a simple quest system
3. **Inventory**: Allow players to buy/sell items
4. **Multiple Locations**: Expand beyond the tavern

## License

This project is for educational and personal use. Please respect the terms of service for OpenAI and ElevenLabs APIs.
