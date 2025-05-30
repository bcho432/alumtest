'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/use-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase';
import { Header } from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { usePublishedContent } from '@/hooks/usePublishedContent';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function Contact() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: faqs = [], isLoading: isLoadingFaqs } = usePublishedContent('faq');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { db } = await getFirebaseServices();
      if (!db) throw new Error('Firestore instance not available');

      // Create support ticket
      const ticketData = {
        ...formData,
        status: 'new',
        priority: 'medium',
        createdAt: serverTimestamp(),
        createdBy: user?.uid || 'anonymous',
        type: 'contact'
      };

      await addDoc(collection(db, 'support_tickets'), ticketData);

      // Send email notification
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: ['matthew.bo@storiats.com', 'derek.lee@storiats.com', 'justin.lontoh@storiats.com'],
          subject: `New Contact Form Submission: ${formData.subject}`,
          text: `
            Name: ${formData.name}
            Email: ${formData.email}
            Subject: ${formData.subject}
            Message: ${formData.message}
          `,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${formData.name}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Subject:</strong> ${formData.subject}</p>
            <p><strong>Message:</strong></p>
            <p>${formData.message}</p>
          `
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email notification');
      }

      toast('Message sent successfully. We will get back to you as soon as possible.', 'success');

      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast('Failed to send message. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
        <div className="container mx-auto px-4 py-12">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
              Contact Us
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Have questions about Storiats? We're here to help. Fill out the form below and we'll get back to you as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Contact Form Section */}
            <Card className="p-8 bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="What is this regarding?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="w-full bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 min-h-[150px]"
                      placeholder="Your message..."
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </Button>
              </form>
            </Card>

            {/* FAQ Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
              {isLoadingFaqs ? (
                <div className="flex justify-center items-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : faqs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No FAQs available at the moment.
                </div>
              ) : (
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div
                      key={faq.id}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                    >
                      <button
                        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 focus:outline-none"
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      >
                        <span className="font-medium text-gray-900">{faq.title}</span>
                        <Icon
                          name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                          className="h-5 w-5 text-gray-500"
                        />
                      </button>
                      {expandedFaq === index && (
                        <div className="px-6 py-4 bg-gray-50">
                          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: faq.content }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
} 