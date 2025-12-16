'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Globe, Monitor, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SecurityEvent {
  id: string;
  type: string;
  description: string;
  ipAddress: string;
  location: string;
  device: string;
  timestamp: Date;
}

export default function SecurityActivityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<SecurityEvent[]>([]);

  useEffect(() => {
    // TODO: Fetch security events from API
    // For now using mock data
    const mockEvents: SecurityEvent[] = [
      {
        id: '1',
        type: 'Login',
        description: 'Successful login',
        ipAddress: '192.168.1.1',
        location: 'New York, US',
        device: 'Chrome on MacOS',
        timestamp: new Date(2024, 3, 18, 14, 30),
      },
      {
        id: '2',
        type: '2FA',
        description: '2FA enabled',
        ipAddress: '192.168.1.1',
        location: 'New York, US',
        device: 'Chrome on MacOS',
        timestamp: new Date(2024, 3, 18, 14, 25),
      },
      {
        id: '3',
        type: 'Password',
        description: 'Password changed',
        ipAddress: '192.168.1.1',
        location: 'New York, US',
        device: 'Chrome on MacOS',
        timestamp: new Date(2024, 3, 17, 10, 15),
      },
    ];
    setEvents(mockEvents);
    setFilteredEvents(mockEvents);
  }, []);

  useEffect(() => {
    const filtered = events.filter((event) =>
      Object.values(event).some((value) =>
        value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    setFilteredEvents(filtered);
  }, [searchQuery, events]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Security Activity</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline">Export</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            View your recent security-related activities and login history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Device & Location</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{event.type}</p>
                      <p className="text-sm text-gray-500">{event.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{event.device}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Globe className="h-3 w-3" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{event.ipAddress}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(event.timestamp)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
          <CardDescription>
            Overview of your account security events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Total Events</p>
              <p className="text-2xl font-bold">{events.length}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Unique Devices</p>
              <p className="text-2xl font-bold">
                {new Set(events.map((e) => e.device)).size}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Unique Locations</p>
              <p className="text-2xl font-bold">
                {new Set(events.map((e) => e.location)).size}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 