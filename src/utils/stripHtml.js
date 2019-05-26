import xss from 'xss'

export default function stripHtml(text) {
  const el = document.createElement('div')
  el.innerHTML = xss(text)
  return el.textContent
}
