import { redirect } from 'next/navigation';

interface PageProps {
  params: { org: string };
}

export default function OrganizationPage({ params }: PageProps) {
  const { org } = params;
  redirect(`/${org}/dashboard`);
} 