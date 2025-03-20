import { redirect } from 'next/navigation';
import type { Route } from 'next';

export default function Home() {
  // Redirect to login page
  redirect('/auth/login' as Route);
} 