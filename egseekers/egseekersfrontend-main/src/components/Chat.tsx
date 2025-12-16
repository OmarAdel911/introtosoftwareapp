"use client"

import React, { useState, useEffect, useRef } from 'react';
import wsClient from '@/lib/websocket';
import { ChatMessage } from '@/lib/websocket';
import axios from 'axios';
import { config } from '@/config/env';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "FREELANCER" | "CLIENT" | "ADMIN";
}

interface ChatProps {
  recipientId: string;
  recipientName: string;
}

export default function Chat({ recipientId, recipientName }: ChatProps) {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get<User>('${config.apiUrl}/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket when component mounts
    wsClient.connect();

    // Handle incoming messages
    const handleMessage = (data: { message: ChatMessage }) => {
      if (data.message.senderId === recipientId || data.message.recipientId === recipientId) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    wsClient.on('CHAT_MESSAGE', handleMessage);

    // Cleanup on unmount
    return () => {
      wsClient.off('CHAT_MESSAGE', handleMessage);
      wsClient.disconnect();
    };
  }, [recipientId, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      wsClient.sendChatMessage(recipientId, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      {/* Chat header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">{recipientName}</h2>
      </div>

      {/* Messages container */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.senderId === user.id ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                message.senderId === user.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p>{message.content}</p>
              <span className="text-xs opacity-75">
                {new Date(message.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSend} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 