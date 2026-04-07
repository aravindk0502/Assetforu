import { redirect } from 'next/navigation';

function toQueryString(searchParams?: Record<string, string | string[] | undefined>) {
  if (!searchParams) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string') {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export default function OrderRedirectPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  redirect(`/activity/${params.id}/order-details${toQueryString(searchParams)}`);
}

