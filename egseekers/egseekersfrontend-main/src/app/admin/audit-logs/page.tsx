'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Filter, AlertCircle } from 'lucide-react';
import { DateRange } from "react-day-picker";
import { DateRangePicker } from '@/components/ui/date-range-picker';

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  userName: string;
  status: string;
  changes: any;
  createdAt: Date;
}

const statusColors: Record<string, string> = {
  SUCCESS: 'bg-green-100 text-green-800',
  WARNING: 'bg-yellow-100 text-yellow-800',
  ERROR: 'bg-red-100 text-red-800',
  INFO: 'bg-blue-100 text-blue-800',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  useEffect(() => {
    // TODO: Fetch audit logs from API
    // For now using mock data
    const mockLogs: AuditLog[] = [
      {
        id: '1',
        action: 'CREATE',
        resourceType: 'USER',
        resourceId: 'user123',
        userId: 'admin1',
        userName: 'Admin User',
        status: 'SUCCESS',
        changes: { email: 'user@example.com', role: 'FREELANCER' },
        createdAt: new Date(2024, 3, 18, 14, 30),
      },
      {
        id: '2',
        action: 'UPDATE',
        resourceType: 'JOB',
        resourceId: 'job456',
        userId: 'user123',
        userName: 'John Doe',
        status: 'WARNING',
        changes: { status: 'COMPLETED', payment: 1000 },
        createdAt: new Date(2024, 3, 18, 13, 15),
      },
      {
        id: '3',
        action: 'DELETE',
        resourceType: 'PROPOSAL',
        resourceId: 'prop789',
        userId: 'user456',
        userName: 'Jane Smith',
        status: 'ERROR',
        changes: null,
        createdAt: new Date(2024, 3, 17, 16, 45),
      },
    ];
    setLogs(mockLogs);
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resourceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = !actionFilter || log.action === actionFilter;
    const matchesResourceType = !resourceTypeFilter || log.resourceType === resourceTypeFilter;
    const matchesStatus = !statusFilter || log.status === statusFilter;
    const matchesDateRange = !dateRange?.from || !dateRange?.to || (
      log.createdAt >= dateRange.from && log.createdAt <= dateRange.to
    );

    return matchesSearch && matchesAction && matchesResourceType && matchesStatus && matchesDateRange;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting logs...');
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter and search through system audit logs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
              </SelectContent>
            </Select>

            <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Resources</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="JOB">Job</SelectItem>
                <SelectItem value="PROPOSAL">Proposal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
              </SelectContent>
            </Select>

            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Select date range"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource Type</TableHead>
                <TableHead>Resource ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Changes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDate(log.createdAt)}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.resourceType}</TableCell>
                  <TableCell className="font-mono text-sm">{log.resourceId}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{log.userName}</p>
                      <p className="text-sm text-gray-500">{log.userId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[log.status]}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      View Changes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No audit logs found.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Summary</CardTitle>
          <CardDescription>
            Overview of system audit events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Total Events</p>
              <p className="text-2xl font-bold">{logs.length}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Success Rate</p>
              <p className="text-2xl font-bold">
                {Math.round((logs.filter(log => log.status === 'SUCCESS').length / logs.length) * 100)}%
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Unique Users</p>
              <p className="text-2xl font-bold">
                {new Set(logs.map(log => log.userId)).size}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Resource Types</p>
              <p className="text-2xl font-bold">
                {new Set(logs.map(log => log.resourceType)).size}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 