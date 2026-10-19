import { redirect } from 'next/navigation';

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  redirect(searchParams.reason === 'timeout' ? '/admin?reason=timeout' : '/admin');
}
