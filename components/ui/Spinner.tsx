import { Loader2 } from 'lucide-react'

export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: '#78817b' }}>
      <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  )
}