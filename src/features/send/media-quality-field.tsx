import { useId } from 'react'
import type { MediaQuality } from '@/api/send'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const descriptions: Record<MediaQuality, string> = {
  standard: 'Dioptimalkan agar unggahan lebih kecil.',
  hd: 'Resolusi lebih tinggi dengan unggahan lebih besar.',
  original: 'Kirim berkas asli tanpa kompresi.',
}

export function MediaQualityField({
  value,
  onChange,
}: {
  value: MediaQuality
  onChange: (value: MediaQuality) => void
}) {
  const controlId = useId()
  const descriptionId = `${controlId}-description`

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={controlId}>Kualitas media</Label>
      <Select value={value} onValueChange={(next) => onChange(next as MediaQuality)}>
        <SelectTrigger id={controlId} aria-describedby={descriptionId} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="standard">Standar</SelectItem>
          <SelectItem value="hd">HD</SelectItem>
          <SelectItem value="original">Asli</SelectItem>
        </SelectContent>
      </Select>
      <p id={descriptionId} className="text-muted-foreground text-xs">
        {descriptions[value]}
      </p>
    </div>
  )
}
