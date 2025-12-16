'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Search, LifeBuoy, FileQuestion, MessageSquare } from 'lucide-react';
import { toast } from '@/components/ui/toast';

const categories = [
  { id: 'account', name: 'Account Issues' },
  { id: 'billing', name: 'Billing & Payments' },
  { id: 'technical', name: 'Technical Support' },
  { id: 'feature', name: 'Feature Request' },
  { id: 'other', name: 'Other' },
];

const priorities = [
  { id: 'low', name: 'Low' },
  { id: 'medium', name: 'Medium' },
  { id: 'high', name: 'High' },
];

const faqs = [
  {
    id: '1',
    question: 'How do I reset my password?',
    answer: 'You can reset your password by clicking on the "Forgot Password" link on the login page. Follow the instructions sent to your email to create a new password.',
    category: 'Account',
  },
  {
    id: '2',
    question: 'How do I update my payment method?',
    answer: 'Go to Settings > Billing to manage your payment methods. You can add, remove, or update your payment information there.',
    category: 'Billing',
  },
  {
    id: '3',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers.',
    category: 'Billing',
  },
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Call API to create ticket
      toast.success('Your support ticket has been submitted successfully.');
      // Reset form
      setCategory('');
      setPriority('');
      setSubject('');
      setDescription('');
    } catch (error) {
      toast.error('Failed to create support ticket.');
    }
  };

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">How can we help?</h1>
        <p className="text-gray-500">
          Search our FAQ for quick answers or create a support ticket for personalized assistance.
        </p>
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search FAQ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Create Support Ticket
            </CardTitle>
            <CardDescription>
              Submit a ticket for personalized assistance from our support team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed information about your issue"
                  rows={5}
                />
              </div>

              <Button type="submit" className="w-full">
                Submit Ticket
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              Quick answers to common questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {filteredFaqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">{faq.answer}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Category: {faq.category}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {filteredFaqs.length === 0 && (
              <div className="text-center py-8">
                <FileQuestion className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No matching FAQs found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5" />
            Additional Support Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4 px-6">
              <div className="text-left">
                <h3 className="font-medium">Documentation</h3>
                <p className="text-sm text-gray-500">
                  Browse our detailed documentation
                </p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto py-4 px-6">
              <div className="text-left">
                <h3 className="font-medium">Video Tutorials</h3>
                <p className="text-sm text-gray-500">
                  Watch step-by-step guides
                </p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto py-4 px-6">
              <div className="text-left">
                <h3 className="font-medium">Community Forum</h3>
                <p className="text-sm text-gray-500">
                  Connect with other users
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 