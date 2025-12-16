import { cn } from "@/lib/utils"

interface MessageProps {
  content: string
  time: string
  sender: "me" | "them"
}

export function Message({ content, time, sender }: MessageProps) {
  return (
    <div
      className={cn(
        "flex",
        sender === "me" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-lg p-3",
          sender === "me"
            ? "bg-primary text-primary-foreground"
            : "bg-accent"
        )}
      >
        <p>{content}</p>
        <span className="text-xs opacity-70 mt-1 block">
          {time}
        </span>
      </div>
    </div>
  )
} 