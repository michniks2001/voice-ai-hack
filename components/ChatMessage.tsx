import { Message } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
    message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user'

    return (
        <div className={cn(
            "flex w-full mb-4",
            isUser ? "justify-end" : "justify-start"
        )}>
            <Card className={cn(
                "max-w-[80%]",
                isUser
                    ? "bg-blue-500 text-white"
                    : "bg-amber-100 border-amber-300"
            )}>
                <CardContent className="p-3">
                    <div className="flex items-start space-x-2">
                        <div className="text-sm font-medium mb-1">
                            {message.characterName}
                        </div>
                    </div>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
