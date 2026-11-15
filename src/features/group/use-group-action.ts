import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { toApiError } from '@/lib/api-error'

/**
 * Group-module mutation with Indonesian toasts: `success` on success and
 * "<failure>: <server message>" on error (e.g. "Gagal menyimpan nama: …").
 */
export function useGroupAction<TData, TVars>(
  mutationFn: (vars: TVars) => Promise<TData>,
  options: {
    success: string | ((data: TData, vars: TVars) => string)
    failure: string
    onSuccess?: (data: TData, vars: TVars) => void
  },
) {
  return useMutation<TData, unknown, TVars>({
    mutationFn,
    onSuccess: (data, vars) => {
      toast.success(
        typeof options.success === 'function' ? options.success(data, vars) : options.success,
      )
      options.onSuccess?.(data, vars)
    },
    onError: (error) => toast.error(`${options.failure}: ${toApiError(error).message}`),
  })
}
