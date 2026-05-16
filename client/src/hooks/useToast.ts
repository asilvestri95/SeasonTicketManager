import { useState, useCallback } from 'react'

type ToastVariant = 'default' | 'destructive' | 'success'

interface ToastMessage {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

let toastQueue: ((toast: ToastMessage) => void) | null = null

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const toast = useCallback(
    ({ title, description, variant = 'default' }: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, title, description, variant }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4000)
    },
    []
  )

  toastQueue = toast

  return { toasts, toast, dismiss: (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)) }
}

export function toast(msg: Omit<ToastMessage, 'id'>) {
  toastQueue?.(msg)
}
