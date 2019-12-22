import { useState, useRef } from 'react'

const usePopover = () => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const anchorCallbackRef = (el: any) => {
    if (el !== anchorEl) setAnchorEl(el)
  }
  const open = useRef((event: Event) => {
    event.stopPropagation()
    setIsOpen(true)
  }).current
  const close = useRef((event: Event) => {
    event.stopPropagation()
    setIsOpen(false)
  }).current
  const toggle = isOpen ? close : open

  return {
    anchorEl,
    anchorCallbackRef,
    open,
    close,
    toggle,
    isOpen,
  }
}

export default usePopover
