'use client';

import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { AnimatedBlobs } from '@/components/ui/AnimatedBlobs';
import { FeaturedUniversities } from '@/components/university/FeaturedUniversities';
import { SearchBar } from '@/components/common/SearchBar';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white relative overflow-x-hidden">
      {/* Hero Section with Animated Blobs */}
      <section className="relative flex flex-col items-center justify-center text-center w-full px-6 pt-24 pb-16 md:pb-32 z-10 bg-gradient-to-br from-indigo-100 via-purple-100 to-white shadow-xl overflow-hidden">
        <AnimatedBlobs />
        <div className="flex flex-col items-center animate-fade-in-up relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full animate-pop">What's new</span>
            <span className="text-xs text-gray-400">Just shipped v1.0</span>
          </div>
          <h1 className="text-6xl font-extrabold text-gray-900 mb-4 leading-tight drop-shadow-xl">
            Preserve Memories,<br />Honor Legacies
          </h1>
          <p className="text-2xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Create beautiful digital memorials that celebrate life stories and connect generations. Share memories, build timelines, and keep legacies alive.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/auth/signup"
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Get started
            </Link>
            <Link href="/about" className="text-sm font-semibold leading-6 text-gray-900">
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        {/* Fun Hero Illustration */}
        <div className="relative flex justify-center mt-8 animate-fade-in z-10">
          <div className="bg-gradient-to-br from-indigo-200 via-purple-200 to-white rounded-3xl shadow-2xl p-10 w-full max-w-lg flex flex-col items-center border-2 border-indigo-100 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-100 text-indigo-600 rounded-lg p-3 animate-bounce-slow">
                <Icon name="image" className="h-8 w-8" />
              </div>
              <span className="font-bold text-2xl text-gray-900">Digital Memorials</span>
            </div>
            <p className="text-gray-600 text-lg font-medium mb-2">
              Create lasting digital memorials that honor and preserve memories for generations to come.
            </p>
            <div className="flex gap-2 mt-2">
              <Icon name="clock" className="h-5 w-5 text-indigo-400 animate-spin-slow" />
              <Icon name="users" className="h-5 w-5 text-purple-400 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 z-10 bg-white text-center">
        <div className="mb-12">
          <span className="text-indigo-600 font-semibold">Everything you need</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">Powerful features for preserving memories</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform provides everything you need to create meaningful digital memorials that honor and celebrate life stories.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <FeatureCard
            icon="image"
            title="Digital Memorials"
            description="Create beautiful, lasting tributes with stories, photos, and more."
          />
          <FeatureCard
            icon="clock"
            title="Timeline Stories"
            description="Document life events and milestones in an interactive timeline."
          />
          <FeatureCard
            icon="users"
            title="Family Connections"
            description="Invite loved ones to contribute and keep memories alive together."
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="max-w-7xl mx-auto px-6 py-24 z-10 bg-gray-50 text-center rounded-3xl my-12">
        <div className="mb-12">
          <span className="text-indigo-600 font-semibold">How It Works</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">A simple, meaningful process</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <StepCard
            icon="userPlus"
            title="Create Account"
            description="Sign up to start creating and managing digital memorials."
          />
          <StepCard
            icon="edit"
            title="Build the Story"
            description="Add memories, photos, and milestones to create a rich timeline."
          />
          <StepCard
            icon="share"
            title="Share & Connect"
            description="Invite others to contribute and keep the legacy alive."
          />
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="max-w-7xl mx-auto px-6 py-24 z-10 bg-white text-center">
        <div className="mb-12">
          <span className="text-indigo-600 font-semibold">Trusted by Families</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-4">What our users say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <TestimonialCard
            name="Sarah M."
            role="Granddaughter"
            text="Memory Vista made it easy to honor my grandfather's life and share his story with our family."
          />
          <TestimonialCard
            name="Michael R."
            role="Family Historian"
            text="A powerful platform for preserving and celebrating our family's legacy."
          />
          <TestimonialCard
            name="James T."
            role="Family Member"
            text="The timeline and collaboration features are outstanding."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-500 to-purple-500 py-16 text-center text-white z-10 rounded-3xl max-w-7xl mx-auto my-12">
        <h2 className="text-4xl font-bold mb-4">Start preserving memories today</h2>
        <p className="text-lg mb-8">Join thousands of families using Memory Vista to honor and celebrate life stories.</p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/auth/signup"
            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Get started
          </Link>
          <Link href="/about" className="text-sm font-semibold leading-6 text-gray-900">
            Learn more <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Featured Universities Section */}
      <section className="py-16 bg-white">
        <FeaturedUniversities />
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-start hover:scale-105 hover:shadow-2xl transition-all duration-200 animate-fade-in-up">
      <div className="bg-indigo-100 text-indigo-600 rounded-lg p-3 mb-4">
        <Icon name={icon} className="h-7 w-7" />
      </div>
      <h3 className="font-bold text-xl mb-2">{title}</h3>
      <p className="text-gray-600 text-base font-medium">{description}</p>
    </div>
  );
}

function StepCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center text-center hover:scale-105 hover:shadow-2xl transition-all duration-200 animate-fade-in-up">
      <div className="bg-indigo-100 text-indigo-600 rounded-lg p-3 mb-4">
        <Icon name={icon} className="h-7 w-7" />
      </div>
      <h3 className="font-bold text-xl mb-2">{title}</h3>
      <p className="text-gray-600 text-base font-medium">{description}</p>
    </div>
  );
}

function TestimonialCard({ name, role, text }: { name: string; role: string; text: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-start animate-fade-in-up">
      <p className="text-gray-700 text-lg mb-4">"{text}"</p>
      <div className="flex items-center gap-3 mt-auto">
        <div className="bg-indigo-200 rounded-full h-10 w-10 flex items-center justify-center font-bold text-indigo-700 text-lg">{name[0]}</div>
        <div>
          <div className="font-semibold text-gray-900 text-base">{name}</div>
          <div className="text-xs text-gray-500">{role}</div>
        </div>
      </div>
    </div>
  );
} 