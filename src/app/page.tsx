import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

export default function Home() {
  return (
    <div className="relative isolate">
      {/* Background blobs */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] animate-blob"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>
      
      <div className="absolute inset-x-0 -top-70 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-110" aria-hidden="true">
        <div
          className="relative left-[calc(40%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[20deg] bg-gradient-to-tr from-[#60a5fa] to-[#4f46e5] opacity-30 sm:left-[calc(50%-20rem)] sm:w-[72.1875rem] animate-blob animation-delay-2000"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      {/* Hero section */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-500">
              Preserve Memories, Share Stories
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Create beautiful digital memorials to honor and remember your loved ones. Share their stories, photos, and legacy with family, friends, and future generations.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/signup"
              className="rounded-md bg-indigo-600 px-5 py-3 text-md font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 btn-hover-effect"
            >
              Get started
            </Link>
            <Link 
              href="/about" 
              className="text-md font-semibold leading-6 text-gray-900 flex items-center group"
            >
              Learn more 
              <span className="ml-1 transform group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-24">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Digital Memorials</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to honor their memory
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Create a lasting tribute with photos, stories, and memories. Share with family and friends, and keep their legacy alive.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col profile-card p-6 bg-white">
                <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-gray-900">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-600 text-white">
                    <Icon name={feature.icon} className="h-5 w-5" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                  <p className="mt-6">
                    <Link
                      href={feature.href}
                      className="text-sm font-semibold leading-6 text-indigo-600 flex items-center group"
                    >
                      {feature.linkText}
                      <span className="ml-1 transform group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true">→</span>
                    </Link>
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-gradient-primary py-16 sm:py-24 mt-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Start preserving memories today
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-indigo-100">
              Join thousands of families who are creating lasting tributes for their loved ones.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white btn-hover-effect"
              >
                Create a memorial
              </Link>
              <Link
                href="/organizations/join"
                className="text-sm font-semibold leading-6 text-white flex items-center group"
              >
                Join as an organization
                <span className="ml-1 transform group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom blob */}
      <div className="absolute inset-x-0 bottom-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
        <div
          className="relative left-[calc(60%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[40deg] bg-gradient-to-tr from-[#a78bfa] to-[#4f46e5] opacity-30 sm:left-[calc(50%-10rem)] sm:w-[72.1875rem] animate-blob animation-delay-4000"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>
    </div>
  );
}

const features = [
  {
    name: 'Beautiful Profiles',
    icon: 'image',
    description: 'Create stunning memorial profiles with photos, stories, and memories. Customize the look and feel to match their personality and life story.',
    href: '/features/profiles',
    linkText: 'Learn about profiles',
  },
  {
    name: 'Share & Connect',
    icon: 'share',
    description: 'Invite family and friends to contribute their own memories and photos. Keep everyone connected through shared stories and moments.',
    href: '/features/sharing',
    linkText: 'See sharing options',
  },
  {
    name: 'Digital Legacy',
    icon: 'heart',
    description: 'Build a chronological timeline of their life events, achievements, and special moments. Add photos and stories to each event to create a complete narrative.',
    href: '/features/legacy',
    linkText: 'Explore legacy options',
  },
]; 