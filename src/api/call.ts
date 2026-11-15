import { deviceHeaders } from '@/api/request'
import { http, results } from '@/lib/http'

export function rejectCall(payload: { caller_jid: string; call_id: string }, deviceId?: string) {
  return results<{ status: string }>(http.post('/call/reject', payload, deviceHeaders(deviceId)))
}
