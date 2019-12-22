import { useState, useRef } from 'react'

const usePopover = () => {
  const [anchorEl, setAnchorEl] = useState<EventTarget | null>(null)
  const open = useRef((event: Event) => {
    setAnchorEl(event.currentTarget)
  }).current
  const close = useRef(() => {
    setAnchorEl(null)
  }).current
  const isOpen = Boolean(anchorEl)
  const toggle = isOpen ? close : open
  return {
    anchorEl,
    setAnchorEl,
    open,
    close,
    toggle,
    isOpen,
  }
}

export default usePopover
