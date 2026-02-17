import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { settingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  Search,
  HelpCircle,
  FileText,
  MessageCircle,
  Mail,
  Phone,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Ticket,
  Book,
  Video,
  Users,
  Settings,
  Shield,
  CreditCard,
} from 'lucide-react';

const HelpPage = () => {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: 'All Topics', icon: HelpCircle },
    { value: 'getting_started', label: 'Getting Started', icon: Book },
    { value: 'applications', label: 'Applications', icon: FileText },
    { value: 'account', label: 'Account & Profile', icon: Users },
    { value: 'billing', label: 'Billing', icon: CreditCard },
    { value: 'technical', label: 'Technical', icon: Settings },
    { value: 'security', label: 'Security', icon: Shield },
  ];

  const quickLinks = [
    { title: 'Getting Started Guide', description: 'Learn the basics of the platform', icon: Book, link: '#' },
    { title: 'Video Tutorials', description: 'Watch step-by-step video guides', icon: Video, link: '#' },
    { title: 'Contact Support', description: 'Get help from our support team', icon: MessageCircle, link: '/tickets' },
    { title: 'Community Forum', description: 'Connect with other users', icon: Users, link: '#' },
  ];

  useEffect(() => {
    fetchFaqs();
  }, [selectedCategory]);

  const fetchFaqs = async () => {
    try {
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {};
      const response = await settingsAPI.getFaqs(params);
      setFaqs(response.data);
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
      // Use default FAQs if API fails
      setFaqs(defaultFaqs);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (faqId, helpful) => {
    toast.success(helpful ? 'Thanks for your feedback!' : 'We\'ll work on improving this');
  };

  const defaultFaqs = [
    {
      id: '1',
      question: 'How do I apply for a bursary?',
      answer: 'To apply for a bursary, navigate to the Applications page from the sidebar menu. Click on "New Application" and complete the 4-step application form. Make sure you have all required documents ready before starting.',
      category: 'applications',
    },
    {
      id: '2',
      question: 'What documents do I need for my application?',
      answer: 'You will typically need: certified ID copy, proof of residence, academic transcripts, proof of income (parents/guardians), bank statements, and a motivational letter. Specific requirements may vary by sponsor.',
      category: 'applications',
    },
    {
      id: '3',
      question: 'How do I reset my password?',
      answer: 'On the login page, click "Forgot Password" and enter your registered email address. You will receive a password reset link. If you don\'t receive the email, check your spam folder or contact support.',
      category: 'account',
    },
    {
      id: '4',
      question: 'How can I track my application status?',
      answer: 'Go to the Applications page to see all your submitted applications. Each application shows its current status: Draft, Submitted, Under Review, Approved, or Rejected. You can click on any application to see more details.',
      category: 'applications',
    },
    {
      id: '5',
      question: 'How do I schedule a meeting with Zoom or Teams?',
      answer: 'Navigate to the Meetings page and click "Schedule Meeting". Select your meeting type (Zoom or Teams), enter the meeting link, ID, and password. Attendees will be able to see the meeting details and join directly from the platform.',
      category: 'technical',
    },
    {
      id: '6',
      question: 'How do I submit an expense claim?',
      answer: 'Go to the Expenses page and click "Submit Expense". Fill in the details including amount, category, date, and attach any receipts. Your expense will be submitted for approval.',
      category: 'billing',
    },
    {
      id: '7',
      question: 'How do I share notes with my team?',
      answer: 'Open the note you want to share and click the "Share" button. You can share with specific users or entire teams. Shared notes will appear in their "Shared with Me" section.',
      category: 'technical',
    },
    {
      id: '8',
      question: 'Is my data secure?',
      answer: 'Yes, we take data security seriously. All data is encrypted in transit and at rest. We use industry-standard security practices and regularly audit our systems. Your personal information is only accessible to authorized personnel.',
      category: 'security',
    },
  ];

  const displayFaqs = faqs.length > 0 ? faqs : defaultFaqs;

  const filteredFaqs = displayFaqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="help-page">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900 mb-2">Help & Support</h2>
        <p className="text-slate-600">Find answers to common questions or contact our support team</p>
      </div>

      {/* Search */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-6">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search for help topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-6 text-lg"
                data-testid="search-help-input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link, index) => (
          <Link key={index} to={link.link}>
            <Card className="bg-white border-slate-200 hover:shadow-md transition-all duration-200 h-full">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <link.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{link.title}</h3>
                    <p className="text-sm text-slate-600">{link.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories */}
        <Card className="bg-white border-slate-200 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.value}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                  selectedCategory === cat.value
                    ? 'bg-primary text-white'
                    : 'hover:bg-slate-100'
                }`}
                onClick={() => setSelectedCategory(cat.value)}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* FAQs */}
        <div className="lg:col-span-3">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-8">
                  <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No FAQs found matching your search</p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id}>
                      <AccordionTrigger className="text-left" data-testid={`faq-${faq.id}`}>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            {categories.find(c => c.value === faq.category)?.label || faq.category}
                          </Badge>
                          <span>{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-2 pb-4">
                          <p className="text-slate-600 mb-4">{faq.answer}</p>
                          <div className="flex items-center gap-4 border-t pt-4">
                            <span className="text-sm text-slate-500">Was this helpful?</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleFeedback(faq.id, true)}
                            >
                              <ThumbsUp className="w-4 h-4" />
                              Yes
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleFeedback(faq.id, false)}
                            >
                              <ThumbsDown className="w-4 h-4" />
                              No
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Support */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Still need help?</h3>
                <p className="text-sm text-slate-600">Our support team is here to assist you</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/tickets">
                <Button variant="outline" className="gap-2">
                  <Ticket className="w-4 h-4" />
                  Open Ticket
                </Button>
              </Link>
              <Button className="gap-2">
                <Mail className="w-4 h-4" />
                Email Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpPage;
