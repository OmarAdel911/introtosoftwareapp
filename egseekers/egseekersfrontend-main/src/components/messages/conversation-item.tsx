interface ConversationItemProps {
  name: string
  lastMessage: string
  time: string
  unread: number
  avatar: string
  onClick?: () => void
}

export function ConversationItem({
  name,
  lastMessage,
  time,
  unread,
  avatar,
  onClick
}: ConversationItemProps) {
  return (
    <div
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent cursor-pointer"
      onClick={onClick}
    >
      <img
        src={avatar}
        alt={name}
        className="w-12 h-12 rounded-full"
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className="font-semibold truncate">{name}</h3>
          <span className="text-xs text-muted-foreground">
            {time}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {lastMessage}
        </p>
      </div>
      {unread > 0 && (
        <div className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full">
          {unread}
        </div>
      )}
    </div>
  )
} 