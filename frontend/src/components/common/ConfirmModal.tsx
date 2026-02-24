import type { ConfirmModalProps } from "@/types"

export const ConfirmModal = ({
  open,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[480px] rounded-2xl bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onCancel} className="text-red-500 text-xl cursor-pointer">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 text-gray-700">{message}</div>

        {/* Footer */}
        <div className="flex justify-end gap-4 border-t px-6 py-4">
          <button onClick={onCancel} className="rounded-lg border px-4 py-2 cursor-pointer" disabled={isLoading}>
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-lg px-4 py-2 text-white cursor-pointer ${
              variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
