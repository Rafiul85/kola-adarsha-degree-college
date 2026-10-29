import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const timer = window.setTimeout(() => {
        const target = document.getElementById(hash.slice(1))
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else {
          window.scrollTo({ top: 0, behavior: 'auto' })
        }
      }, 160)
      return () => window.clearTimeout(timer)
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
    return undefined
  }, [pathname, search, hash])

  return null
}
