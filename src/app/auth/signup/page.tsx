import { Suspense } from 'react';
import SignUpForm from './SignUpForm';
import SignUpLoading from './loading';

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpLoading />}>
      <SignUpForm />
    </Suspense>
  );
} 