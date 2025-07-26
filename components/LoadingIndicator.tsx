import { Loader2 } from 'lucide-react'

interface LoadingIndicatorProps {
    message: string
}

export function LoadingIndicator({ message }: LoadingIndicatorProps) {
    return (
        <div className="flex items-center justify-center space-x-2 p-4">
            <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
            <span className="text-sm text-amber-700 font-medium">{message}</span>
        </div>
    )
}
