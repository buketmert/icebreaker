import { useEffect, useState } from 'react'

const PREFIX = 'buzkiran:'

function read<T>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw != null) return JSON.parse(raw) as T
  } catch {
    // Gizli pencere, engellenmiş depolama ya da bozuk veri: varsayılana dön.
  }
  return fallback()
}

/** useState gibi çalışır, değeri tarayıcının localStorage'ında saklar. */
export function useLocalStorage<T>(key: string, fallback: () => T) {
  const [value, setValue] = useState<T>(() => read(key, fallback))

  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      // Depolama yoksa uygulama yine de oturum boyunca çalışır.
    }
  }, [key, value])

  return [value, setValue] as const
}
