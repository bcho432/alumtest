'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

const values = [
  {
    name: 'Preservation',
    description: 'We are committed to preserving memories and stories for generations to come.',
    icon: 'archive'
  },
  {
    name: 'Respect',
    description: 'We treat every memorial with the utmost respect and dignity.',
    icon: 'heart'
  },
  {
    name: 'Community',
    description: 'We foster a supportive community where people can share and connect.',
    icon: 'users'
  },
  {
    name: 'Innovation',
    description: 'We continuously improve our platform to better serve our users.',
    icon: 'lightbulb'
  }
];

export default function About() {
  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-indigo-100/20">
        <div className="mx-auto max-w-7xl pb-24 pt-10 sm:pb-32 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:py-20">
          <div className="px-6 lg:px-0 lg:pt-4">
            <div className="mx-auto max-w-2xl">
              <div className="max-w-lg">
                <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                  About Memory Vista
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Memory Vista is a digital memorial platform dedicated to preserving and honoring the legacies of loved ones. Our mission is to create a space where memories can be shared, stories can be told, and lives can be celebrated.
                </p>
                <div className="mt-10 flex items-center gap-x-6">
                  <Link
                    href="/signup"
                    className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 btn-hover-effect"
                  >
                    Get started
                  </Link>
                  <Link 
                    href="/contact" 
                    className="text-sm font-semibold leading-6 text-gray-900 flex items-center group"
                  >
                    Contact us <span className="ml-1 transform group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-20 sm:mt-24 md:mx-auto md:max-w-2xl lg:mx-0 lg:mt-0 lg:w-screen">
            <div
              className="absolute inset-y-0 right-1/2 -z-10 -mr-10 w-[200%] skew-x-[-30deg] bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 md:-mr-20 lg:-mr-36"
              aria-hidden="true"
            />
            <div className="shadow-lg md:rounded-3xl">
              <div className="bg-indigo-500 [clip-path:inset(0)] md:[clip-path:inset(0_round_theme(borderRadius.3xl))]">
                <div
                  className="absolute -inset-y-px left-1/2 -z-10 ml-10 w-[200%] skew-x-[-30deg] bg-indigo-100 opacity-20 ring-1 ring-inset ring-white md:ml-20 lg:ml-36"
                  aria-hidden="true"
                />
                <div className="relative px-6 pt-8 sm:pt-16 md:pl-16 md:pr-0">
                  <div className="mx-auto max-w-2xl md:mx-0 md:max-w-none">
                    <div className="w-screen overflow-hidden rounded-tl-xl bg-gray-900">
                      <div className="flex bg-gray-800/40 ring-1 ring-white/5">
                        <div className="-mb-px flex text-sm font-medium leading-6 text-gray-400">
                          <div className="border-b border-r border-b-white/20 border-r-white/10 bg-white/5 px-4 py-2 text-white">
                            Memorial.jsx
                          </div>
                          <div className="border-r border-gray-600/10 px-4 py-2">Footer.jsx</div>
                        </div>
                      </div>
                      <div className="px-6 pb-14 pt-6 text-white">
                        {/* Code block */}
                        <pre className="text-sm leading-6 text-gray-300">
                          <div>{`<MemorialProfile`}</div>
                          <div>{`  name="Jane Smith"`}</div>
                          <div>{`  birthDate="April 15, 1942"`}</div>
                          <div>{`  passedDate="January 20, 2023"`}</div>
                          <div>{`  coverPhoto="/images/garden.jpg"`}</div>
                          <div>{`  profilePhoto="/images/jane.jpg"`}</div>
                          <div>{`>`}</div>
                          <div>{`  <Tribute author="John Smith">`}</div>
                          <div>{`    Mom, your love continues to guide us.`}</div>
                          <div>{`    We miss you every day.`}</div>
                          <div>{`  </Tribute>`}</div>
                          <div>{`  <PhotoGallery images={memories} />`}</div>
                          <div>{`  <Timeline events={lifeEvents} orgId="demo-org" />`}</div>
                          <div>{`  <GuestBook entryLimit={10} />`}</div>
                          <div>{`</MemorialProfile>`}</div>
                        </pre>
                      </div>
                    </div>
                  </div>
                  <div
                    className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10 md:rounded-3xl"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-white sm:h-32" />
      </div>

      {/* Values section */}
      <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-20 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Our Values</h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            At Memory Vista, we believe in creating meaningful digital spaces that honor and preserve the memories of loved ones. Our platform is built on these core values:
          </p>
        </div>
        <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 text-base leading-7 text-gray-600 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:gap-x-16">
          {values.map((value) => (
            <div key={value.name} className="relative pl-9">
              <dt className="inline font-semibold text-gray-900">
                <div className="absolute left-1 top-1 text-indigo-600">
                  <Icon name={value.icon} className="h-5 w-5" />
                </div>
                {value.name}
              </dt>{' '}
              <dd className="inline">{value.description}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* CTA section */}
      <div className="relative isolate -z-10 mt-32 sm:mt-40">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-2xl flex-col gap-16 bg-white/5 px-6 py-16 ring-1 ring-white/10 sm:rounded-3xl sm:p-8 lg:mx-0 lg:max-w-none lg:flex-row lg:items-center lg:py-20 xl:gap-x-20 xl:px-20">
            <div className="w-full flex-auto">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Ready to create a lasting memorial?</h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Join thousands of families who have created beautiful digital memorials with Memory Vista. Start preserving memories today.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Link
                  href="/signup"
                  className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 btn-hover-effect"
                >
                  Get started
                </Link>
                <Link 
                  href="/examples" 
                  className="text-sm font-semibold leading-6 text-gray-900 flex items-center group"
                >
                  View examples <span className="ml-1 transform group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
            <div className="w-full flex-none">
              {/* Decorative image */}
              <div className="h-80 overflow-hidden rounded-lg bg-gray-100 shadow-lg">
                <div className="flex h-full items-center justify-center bg-gradient-to-tr from-indigo-500 to-purple-500 text-white">
                  <div className="px-8 text-center">
                    <p className="text-xl font-bold mb-4">Memorial Demo</p>
                    <p>Interactive preview of how your memorial<br />will look and function</p>
                    <button className="mt-6 rounded-md bg-white px-3 py-2 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 btn-hover-effect">
                      View Demo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 