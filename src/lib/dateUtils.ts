import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

export function formatRelativeTime(dateString: string): string {
  const date = parseISO(dateString);
  const now = new Date();
  
  // If it's today, show relative time + absolute time
  if (isToday(date)) {
    const relativeTime = formatDistanceToNow(date, { addSuffix: true });
    const absoluteTime = format(date, 'h:mm a');
    return `${relativeTime} • ${absoluteTime}`;
  }
  
  // If it's yesterday, show "Yesterday at [time]"
  if (isYesterday(date)) {
    const absoluteTime = format(date, 'h:mm a');
    return `Yesterday at ${absoluteTime}`;
  }
  
  // For older dates, show the date and time
  return format(date, 'MMM d, yyyy • h:mm a');
}

export function formatPostDate(dateString: string): string {
  const date = parseISO(dateString);
  
  if (isToday(date)) {
    return `Today • ${format(date, 'h:mm a')}`;
  }
  
  if (isYesterday(date)) {
    return `Yesterday • ${format(date, 'h:mm a')}`;
  }
  
  return format(date, 'MMM d, yyyy • h:mm a');
} 