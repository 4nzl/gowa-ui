import { type FormEvent } from 'react'
import { subscribePresence, subscribePresenceRequest } from '@/api/user'
import { FormActions } from '@/components/shared/curl-dialog'
import { ResultPanel } from '@/components/shared/result-panel'
import { useActionMutation } from '@/hooks/use-action-mutation'
import { useRecipientJid } from '@/stores/recipient'

export function SubscribePresenceForm() {
  const jid = useRecipientJid()
  const mutation = useActionMutation(subscribePresence, {
    successMessage: 'Berlangganan presence',
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate(jid)
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <p className="text-muted-foreground text-sm">
        Langganankan perangkat ini ke status online/offline kontak. Pembaruan dikirim sebagai
        webhook <code className="font-mono text-xs">presence</code>, dan hanya selama perangkat ini
        berstatus tersedia (available).
      </p>
      <FormActions
        submitLabel="Pantau (subscribe)"
        pending={mutation.isPending}
        disabled={!jid}
        request={subscribePresenceRequest(jid)}
      />
      <ResultPanel result={mutation.data} />
    </form>
  )
}
