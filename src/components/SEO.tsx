import { useEffect } from 'react'

const SITE_NAME = 'কোলা আদর্শ ডিগ্রি কলেজ'
const DEFAULT_DESCRIPTION =
  'কোলা আদর্শ ডিগ্রি কলেজ, কোলা, বাদলগাছী, নওগাঁ (EIIN 123139) — ভর্তি, নোটিশ, একাডেমিক তথ্য, ফলাফল ও শিক্ষক তথ্য।'

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

export function usePageMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  noindex = false,
}: {
  title?: string
  description?: string
  noindex?: boolean
}) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Kola Adarsha Degree College`
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title ? `${title} | ${SITE_NAME}` : SITE_NAME)
    setMeta('property', 'og:description', description)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
    setMeta('property', 'og:locale', 'bn_BD')

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = `${window.location.origin}${window.location.pathname}`
  }, [title, description, noindex])
}
