import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatDateRelative(
  date: string | Date | null | undefined,
): string {
  if (!date) return "";
  const now = new Date();
  const adDate = new Date(date);

  // Calculate difference in milliseconds
  const diff = now.getTime() - adDate.getTime();

  // Basic calculations
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Determine if it was today, yesterday, etc.
  const isToday = now.toDateString() === adDate.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = yesterday.toDateString() === adDate.toDateString();

  if (diff < 60000) return "لحظاتی پیش";

  if (isToday) {
    if (minutes < 60) return `${minutes.toLocaleString("fa-IR")} دقیقه پیش`;
    return `امروز، ساعت ${
      adDate.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
    }`;
  }

  if (isYesterday) {
    return `دیروز، ساعت ${
      adDate.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
    }`;
  }

  if (days < 7) return `${days.toLocaleString("fa-IR")} روز پیش`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks.toLocaleString("fa-IR")} هفته پیش`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months.toLocaleString("fa-IR")} ماه پیش`;

  return adDate.toLocaleDateString("fa-IR");
}
