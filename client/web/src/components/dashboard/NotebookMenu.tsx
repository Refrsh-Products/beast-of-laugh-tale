import MenuRow from './MenuRow'
import type { Notebook } from '@freshr/shared'

const B = '#000000'
const W = '#FFFFFF'

export default function NotebookMenu({
  notebook,
  top,
  right,
  onPin,
  onRename,
  onArchive,
  onDelete,
}: {
  notebook: Notebook
  top: number
  right: number
  onPin: () => void
  onRename: () => void
  onArchive: () => void
  onDelete: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top,
        right,
        zIndex: 1000,
        background: W,
        border: `2px solid ${B}`,
        boxShadow: `4px 4px 0 ${B}`,
        minWidth: 140,
        maxWidth: 'calc(100vw - 16px)',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {[
        { label: notebook.pinned ? 'Unpin' : 'Pin', action: onPin, color: B, weight: 400 },
        { label: 'Rename', action: onRename, color: B, weight: 400 },
      ].map((item) => (
        <MenuRow key={item.label} label={item.label} color={item.color} weight={item.weight} action={item.action} />
      ))}
      <div style={{ height: 1, background: '#eee', margin: '2px 0' }} />
      {[
        { label: 'Archive', action: onArchive, color: B, weight: 400 },
        { label: 'Delete', action: onDelete, color: '#cc0000', weight: 600 },
      ].map((item) => (
        <MenuRow key={item.label} label={item.label} color={item.color} weight={item.weight} action={item.action} isDelete={item.label === 'Delete'} />
      ))}
    </div>
  )
}
