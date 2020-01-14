import { useState, useCallback, SyntheticEvent } from 'react'

const usePopover = () => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const anchorCallbackRef = (el: any) => {
    if (el !== anchorEl) setAnchorEl(el)
  }
  const open = useCallback((event: SyntheticEvent) => {
    event.stopPropagation()
    setIsOpen(true)
  }, [])
  const close = useCallback((event: SyntheticEvent) => {
    event.stopPropagation()
    setIsOpen(false)
  }, [])
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
