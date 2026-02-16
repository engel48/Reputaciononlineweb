"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HashtagsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/social-listening?tab=hashtags');
  }, [router]);

  return null;
}
