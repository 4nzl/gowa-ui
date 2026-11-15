import type { ComponentType } from 'react'
import {
  DeleteForm,
  ForwardForm,
  PlayedForm,
  ReactForm,
  ReadForm,
  RevokeForm,
  StarForm,
  UpdateForm,
  type MessageActionProps,
} from '@/features/message/message-forms'
import type { ActModeId, ComposeModeId, MessagingModeId } from '@/features/messaging/modes'
import { SendAudioForm } from '@/features/send/audio-form'
import { SendChatPresenceForm } from '@/features/send/chat-presence-form'
import { SendContactForm } from '@/features/send/contact-form'
import { SendFileForm } from '@/features/send/file-form'
import { SendImageForm } from '@/features/send/image-form'
import { SendInteractiveForm } from '@/features/send/interactive-form'
import { SendLinkForm } from '@/features/send/link-form'
import { SendLocationForm } from '@/features/send/location-form'
import { SendPollForm } from '@/features/send/poll-form'
import { SendPresenceForm } from '@/features/send/presence-form'
import { SendStickerForm } from '@/features/send/sticker-form'
import { SendTextForm } from '@/features/send/text-form'
import { SendVideoForm } from '@/features/send/video-form'
import { SubscribePresenceForm } from '@/features/send/subscribe-presence-form'

const composeForms: Record<ComposeModeId, ComponentType> = {
  text: SendTextForm,
  image: SendImageForm,
  video: SendVideoForm,
  file: SendFileForm,
  audio: SendAudioForm,
  sticker: SendStickerForm,
  contact: SendContactForm,
  location: SendLocationForm,
  link: SendLinkForm,
  poll: SendPollForm,
  interactive: SendInteractiveForm,
  presence: SendPresenceForm,
  'chat-presence': SendChatPresenceForm,
  'subscribe-presence': SubscribePresenceForm,
}

const actForms: Record<ActModeId, ComponentType<MessageActionProps>> = {
  react: ReactForm,
  update: UpdateForm,
  read: ReadForm,
  played: PlayedForm,
  star: StarForm,
  revoke: RevokeForm,
  delete: DeleteForm,
  forward: ForwardForm,
}

/** The form behind one messaging mode. Act forms get the Message ID from the page. */
export function ModeForm({ mode, messageId }: { mode: MessagingModeId; messageId: string }) {
  if (mode in actForms) {
    const Form = actForms[mode as ActModeId]
    return <Form messageId={messageId} />
  }
  const Form = composeForms[mode as ComposeModeId]
  return <Form />
}
