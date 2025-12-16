import { api } from './api';
import { AxiosError } from 'axios';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  createdAt: string;
  read: boolean;
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
  recipient: {
    id: string;
    name: string;
    image: string | null;
  };
}

export interface Conversation {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientImage: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  bio: string | null;
  skills: string[] | null;
  hourlyRate: number | null;
  title: string | null;
  location: string | null;
  website: string | null;
  linkedin: string | null;
  github: string | null;
}

class MessagesApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'MessagesApiError';
  }
}

export const messagesApi = {
  getConversations: async (): Promise<Conversation[]> => {
    try {
      const response = await api.get<Conversation[]>('/messages/conversations');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new MessagesApiError('Failed to fetch conversations', axiosError.response?.status);
    }
  },

  getMessage: async (messageId: string): Promise<Message> => {
    try {
      const response = await api.get<Message>(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new MessagesApiError('Failed to fetch message', axiosError.response?.status);
    }
  },

  getMessages: async (userId: string): Promise<Message[]> => {
    try {
      const response = await api.get<Message[]>(`/messages/conversation/${userId}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new MessagesApiError('Failed to fetch messages', axiosError.response?.status);
    }
  },

  sendMessage: async (recipientId: string, content: string): Promise<Message> => {
    try {
      const response = await api.post<Message>('/messages', { recipientId, content });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new MessagesApiError('Failed to send message', axiosError.response?.status);
    }
  },

  markAsRead: async (userId: string): Promise<void> => {
    try {
      await api.put(`/messages/read/${userId}`);
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new MessagesApiError('Failed to mark messages as read', axiosError.response?.status);
    }
  },

  createConversation: async (participantId: string, initialMessage: string): Promise<Message> => {
    try {
      const response = await api.post<Message>('/messages', {
        recipientId: participantId,
        content: initialMessage,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new MessagesApiError('Failed to create conversation', axiosError.response?.status);
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get<User>('/auth/me');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new MessagesApiError('Failed to fetch current user', axiosError.response?.status);
    }
  },

  getUser: async (userId: string): Promise<User> => {
    try {
      const response = await api.get<User>(`/users/${userId}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new MessagesApiError('Failed to fetch user', axiosError.response?.status);
    }
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    try {
      await api.delete(`/messages/${messageId}`);
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new MessagesApiError('Failed to delete message', axiosError.response?.status);
    }
  },
}; 