import React, { useState, useCallback } from 'react'
import { Card, CardContent } from '@mui/material'
import css from './KeyboardShortcuts.module.css'
import { platform } from '../preload/os'

const KEYBOARD_SHORTCUTS = {
  'Play/pause': `${platform() === 'win32' ? 'Ctrl' : 'Shift'} + Space`,
  'Toggle loop': 'Ctrl + L',
  'Stop looping': 'Esc',
  'Select previous': '←',
  'Select next': '→',
  'Select previous (while editing)': 'Alt + ←',
  'Select next (while editing)': 'Alt + →',
  'Look up word at mouse cursor': 'D',
  'Close dictionary popover': 'Esc',
  'Start editing fields': 'E',
  'Delete clip and card': 'Ctrl + Shift + D',
  'Stop editing fields': 'Esc',
  'Start making cloze deletion': 'C',
  'Stop making cloze deletion': 'Esc',
  'Save project': 'Cmd + S',
} as const

export function getKeyboardShortcut(action: keyof typeof KEYBOARD_SHORTCUTS) {
  return KEYBOARD_SHORTCUTS[action].replace('Cmd', CtrlCmd)
}

const CtrlCmd = platform() === 'darwin' ? '⌘' : 'Ctrl'
const Shortcut = ({ action }: { action: keyof typeof KEYBOARD_SHORTCUTS }) => (
  <p className={css.shortcut}>
    <span className={css.keyCombination}>{getKeyboardShortcut(action)}</span>
    <span className={css.action}>{action}</span>
  </p>
)

const KeyboardShortcuts = () => {
  const [open, setOpen] = useState(false)
  const handleMouseDown = useCallback(
    (e) => {
      setOpen((open) => !open)
      if (!open) e.preventDefault()
    },
    [setOpen, open]
  )
  const handleFocus = useCallback(() => setOpen(true), [setOpen])
  const handleBlur = useCallback(() => setOpen(false), [setOpen])
  return (
    <section
      className={css.container}
      onMouseDown={handleMouseDown}
      tabIndex={0}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {open ? (
        <Card>
          <CardContent className={css.card}>
            <h3 className={css.heading}>Media</h3>
            <section className={css.group}>
              <Shortcut action="Play/pause" />
              <Shortcut action="Toggle loop" />
              <Shortcut action="Stop looping" />
            </section>

            <section className={css.group}>
              <h3 className={css.heading}>Navigate between clips/subtitles</h3>
              <Shortcut action="Select previous" />
              <Shortcut action="Select next" />
              <Shortcut action="Select previous (while editing)" />
              <Shortcut action="Select next (while editing)" />
            </section>

            <section className={css.group}>
              <h3 className={css.heading}>Dictionary</h3>
              <Shortcut action="Look up word at mouse cursor" />
              <Shortcut action="Close dictionary popover" />
            </section>

            <section className={css.group}>
              <h3 className={css.heading}>Editing flashcards</h3>
              <Shortcut action="Start editing fields" />
              <Shortcut action="Stop editing fields" />
              <Shortcut action="Start making cloze deletion" />
              <Shortcut action="Stop making cloze deletion" />
              <Shortcut action="Delete clip and card" />
            </section>

            <section className={css.group}>
              <h3 className={css.heading}>Project</h3>
              <Shortcut action="Save project" />
            </section>
          </CardContent>
        </Card>
      ) : (
        <span className={css.closed}>Keyboard shortcuts</span>
      )}
    </section>
  )
}

export default KeyboardShortcuts
