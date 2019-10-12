import { filterXSS } from 'xss'

export default function stripHtml(text: string) {
  const el = document.createElement('div')
  el.innerHTML = filterXSS(text)
  return el.textContent
}
