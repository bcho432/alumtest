import { Spinner } from '@/components/ui/Spinner';

export default function SignUpLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Spinner className="h-12 w-12 text-indigo-500" />
    </div>
  );
} 