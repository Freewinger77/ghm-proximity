import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const getStoredOverrides = () => {
  const storedOverrides = localStorage.getItem("assistantOverrides")
  return storedOverrides ? JSON.parse(storedOverrides) : {}
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

