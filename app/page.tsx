'use client'

import { useEffect } from 'react'

export default function Page() {
  useEffect(() => {
    fetch('/landing.html')
      .then(r => r.text())
      .then(html => {
        document.open()
        document.write(html)
        document.close()
      })
  }, [])

  return (
    <div style={{
      background: '#060607',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      color: '#7a7468',
      fontSize: '12px',
      letterSpacing: '0.1em'
    }}>
      TEOS SENTINEL — LOADING...
    </div>
  )
}
