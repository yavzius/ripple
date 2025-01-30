import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { StatusVariant } from '@/types/common';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getVariant(
  status: string | null,
  variantMap: Record<string, StatusVariant>
): StatusVariant {
  return status ? variantMap[status.toLowerCase()] || 'default' : 'default';
}

export function formatDate(date: string | Date, formatStr: string = 'PPpp'): string {
  return format(new Date(date), formatStr);
}

export function generateInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function truncateText(text: string, length: number): string {
  return text.length > length ? `${text.substring(0, length)}...` : text;
}
