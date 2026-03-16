// lib/auth.js
import { cookies } from 'next/headers';

export async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}