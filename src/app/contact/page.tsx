'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  
  const [formStatus, setFormStatus] = useState({
    loading: false,
    success: false,
    error: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus({ loading: true, success: false, error: false });
    
    // Simulate a form submission
    try {
      // In a real app, this would be an API call to submit the form
      await new Promise(resolve => setTimeout(resolve, 1500));
      setFormStatus({ loading: false, success: true, error: false });
      // Clear the form
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setFormStatus({ loading: false, success: false, error: true });
    }
  };

  return (
    <div className="bg-white">
      {/* Header section */}
      <div className="relative bg-indigo-700">
        <div className="absolute inset-0">
          <div className="absolute inset-y-0 left-0 w-1/2 bg-gray-50" />
        </div>
        <div className="relative max-w-7xl mx-auto lg:grid lg:grid-cols-5">
          <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:col-span-2 lg:px-8 lg:py-24 xl:pr-12">
            <div className="max-w-lg mx-auto">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Get in touch</h2>
              <p className="mt-3 text-lg leading-6 text-gray-500">
                We're here to help with any questions you may have about Memory Vista.
                Whether you need assistance creating a memorial, want to learn more
                about our services, or have feedback for us, we'd love to hear from you.
              </p>
              <dl className="mt-8 text-base text-gray-500">
                <div className="mt-6">
                  <dt className="sr-only">Email</dt>
                  <dd className="flex">
                    <Icon name="mail" className="h-6 w-6 text-gray-400" aria-hidden="true" />
                    <span className="ml-3">support@memoryvista.com</span>
                  </dd>
                </div>
                <div className="mt-3">
                  <dt className="sr-only">Phone number</dt>
                  <dd className="flex">
                    <Icon name="phone" className="h-6 w-6 text-gray-400" aria-hidden="true" />
                    <span className="ml-3">+1 (555) 123-4567</span>
                  </dd>
                </div>
                <div className="mt-3">
                  <dt className="sr-only">Address</dt>
                  <dd className="flex">
                    <Icon name="location" className="h-6 w-6 text-gray-400" aria-hidden="true" />
                    <span className="ml-3">
                      123 Memory Lane<br />
                      San Francisco, CA 94107
                    </span>
                  </dd>
                </div>
              </dl>
              <p className="mt-6 text-base text-gray-500">
                Looking for answers right away?{' '}
                <Link href="/help" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Visit our Help Center
                </Link>
              </p>
            </div>
          </div>
          <div className="bg-indigo-700 py-16 px-4 sm:px-6 lg:col-span-3 lg:py-24 lg:px-8 xl:pl-12">
            <div className="max-w-lg mx-auto lg:max-w-none">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-6">
                <div>
                  <label htmlFor="name" className="sr-only">
                    Full name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 py-3 px-4 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Full name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 py-3 px-4 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Email"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="sr-only">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 py-3 px-4 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Please select a subject</option>
                    <option value="support">General Support</option>
                    <option value="memorial">Memorial Creation Help</option>
                    <option value="organization">Organization Inquiry</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="sr-only">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 py-3 px-4 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Message"
                    required
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={formStatus.loading}
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-3 px-6 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed w-full btn-hover-effect"
                  >
                    {formStatus.loading ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
                
                {formStatus.success && (
                  <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                    <strong className="font-bold">Thank you! </strong>
                    <span className="block sm:inline">Your message has been sent successfully. We'll get back to you soon.</span>
                  </div>
                )}
                
                {formStatus.error && (
                  <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    <strong className="font-bold">Error! </strong>
                    <span className="block sm:inline">There was a problem sending your message. Please try again later.</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">FAQs</h2>
            <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Find quick answers to common questions about Memory Vista
            </p>
          </div>

          <div className="mt-12">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-12">
              {faqs.map((faq) => (
                <div key={faq.question} className="relative">
                  <dt>
                    <p className="text-lg leading-6 font-medium text-gray-900">{faq.question}</p>
                  </dt>
                  <dd className="mt-2 text-base text-gray-500">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

const faqs = [
  {
    question: "How do I create a memorial page?",
    answer: "To create a memorial page, sign up for an account, click on 'New Memorial' from your dashboard, and follow the guided setup process. You'll be able to add photos, stories, and invite others to contribute."
  },
  {
    question: "Is Memory Vista free to use?",
    answer: "Memory Vista offers both free and premium tiers. The free tier allows you to create basic memorials, while premium options include additional features like unlimited photos, custom themes, and domain names."
  },
  {
    question: "Who can see the memorials I create?",
    answer: "You control the privacy of each memorial. You can make memorials public, private (invitation only), or password-protected. You can change these settings at any time from the memorial settings page."
  },
  {
    question: "How can I invite family and friends to contribute?",
    answer: "From your memorial page, go to the 'Contributors' section and add email addresses of people you'd like to invite. They'll receive an email with instructions on how to contribute stories, photos, and memories."
  },
  {
    question: "Can I create a memorial for an organization or university?",
    answer: "Yes, our organization plans are specifically designed for universities, schools, religious institutions, and other organizations that want to create and manage multiple memorials. Contact us for more information."
  },
  {
    question: "How can I get help with creating my memorial?",
    answer: "We offer comprehensive help resources, including video tutorials, guides, and 24/7 support. You can also contact us directly through this form, and our team will assist you."
  }
]; 