export const isTextFieldFocused = () => {
  const { activeElement, body } = document
  if (!activeElement || activeElement === body) return false
  return (
    activeElement instanceof HTMLSpanElement ||
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLSelectElement
  )
}
