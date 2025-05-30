import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function AuthPage() {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  
  // If the path includes 'signup', redirect to signup, otherwise login
  if (pathname.includes('signup')) {
    redirect('/auth/signup');
  } else {
    redirect('/auth/login');
  }
} 