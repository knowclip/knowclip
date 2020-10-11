import React, { useState, useCallback } from 'react'
import { Card, CardContent } from '@material-ui/core'
import css from './KeyboardShortcuts.module.css'
import os from 'os'

const CtrlCmd = os.platform() === 'darwin' ? '⌘' : 'Ctrl'
const Shortcut = ({ keys, action }: { keys: string; action: string }) => (
  <p className={css.shortcut}>
    <span className={css.keyCombination}>{keys.replace('Cmd', CtrlCmd)}</span>
    <span className={css.action}>{action}</span>
  </p>
)

const KeyboardShortcuts = () => {
  const [open, setOpen] = useState(false)
  const handleMouseDown = useCallback(
    e => {
      setOpen(open => !open)
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
              <Shortcut keys="Shift + Space" action="Play/pause" />
              <Shortcut keys="Ctrl + L" action="Toggle loop" />
              <Shortcut keys="Esc" action="Stop looping" />
            </section>

            <section className={css.group}>
              <h3 className={css.heading}>Navigate between clips/subtitles</h3>
              <Shortcut keys="←" action="Select previous" />
              <Shortcut keys="→" action="Select next" />
              <Shortcut
                keys="Alt + ←"
                action="Select previous (while editing)"
              />
              <Shortcut keys="Alt + →" action="Select next (while editing)" />
              <Shortcut keys="Esc" action="Deselect current" />
            </section>

            <section className={css.group}>
              <h3 className={css.heading}>Dictionary</h3>
              <Shortcut keys="D" action="Look up word at mouse cursor" />
              <Shortcut keys="Esc" action="Close dictionary popover" />
            </section>

            <section className={css.group}>
              <h3 className={css.heading}>Editing flashcards</h3>
              <Shortcut keys="E" action="Start editing fields" />
              <Shortcut keys="Esc" action="Stop editing fields" />
              <Shortcut keys="C" action="Start making cloze deletion" />
              <Shortcut keys="Esc" action="Stop making cloze deletion" />
            </section>

            <section className={css.group}>
              <h3 className={css.heading}>Project</h3>
              <Shortcut keys="Cmd + S" action="Save project" />
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
