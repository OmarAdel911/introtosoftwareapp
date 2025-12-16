import React, { useState } from 'react';
import { format } from 'date-fns';
import { Message } from '@/lib/api/messages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Trash2, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { messagesApi } from '@/lib/api/messages';
import { toast } from '@/components/ui/toast';

interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
  onDelete?: () => void;
}

export function MessageItem({ message, isCurrentUser, onDelete }: MessageItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await messagesApi.deleteMessage(message.id);
      toast.success('The message has been successfully deleted.');
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      toast.error('Failed to delete the message. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          'flex items-start gap-2 p-3 rounded-lg',
          isCurrentUser ? 'flex-row-reverse bg-primary/10' : 'bg-muted'
        )}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={isCurrentUser ? message.sender.image || undefined : message.recipient.image || undefined}
            alt={isCurrentUser ? message.sender.name : message.recipient.name}
          />
          <AvatarFallback>
            {isCurrentUser
              ? message.sender.name.substring(0, 2).toUpperCase()
              : message.recipient.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            'flex flex-col max-w-[80%]',
            isCurrentUser ? 'items-end' : 'items-start'
          )}
        >
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">
              {isCurrentUser ? message.sender.name : message.recipient.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.createdAt), 'MMM d, h:mm a')}
            </span>
            {isCurrentUser && (
              <div className="flex items-center">
                {message.read ? (
                  <CheckCheck className="h-3 w-3 text-primary" />
                ) : (
                  <Check className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
          <p className="text-sm break-words">{message.content}</p>
          {isCurrentUser && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 mt-1 text-muted-foreground hover:text-destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Message"
        description="Are you sure you want to delete this message? This action cannot be undone."
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        confirmVariant="destructive"
      />
    </>
  );
} 