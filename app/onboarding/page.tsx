'use client';

import { useRouter } from 'next/navigation';
import Onboarding, { type OwnerData } from '@/components/Owner/Onboarding';

export default function OnboardingPage() {
  const router = useRouter();

  const handleComplete = (data: OwnerData) => {
    localStorage.setItem('ownerData', JSON.stringify(data));
    router.push('/owner');
  };

  return <Onboarding onComplete={handleComplete} />;
}
