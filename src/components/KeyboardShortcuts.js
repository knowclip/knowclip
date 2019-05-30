import React, { useState, useRef } from 'react'
import { Card, CardContent } from '@material-ui/core'
import css from './KeyboardShortcuts.module.css'
import os from 'os'

const CtrlCmd = os.platform() === 'darwin' ? '⌘' : 'Ctrl'
const Shortcut = ({ keys, action }) => (
  <p className={css.shortcut}>
    <span className={css.keyCombination}>{keys.replace('Cmd', CtrlCmd)}</span>
    <span className={css.action}>{action}</span>
  </p>
)

const KeyboardShortcuts = () => {
  const [open, setOpen] = useState(false)
  const handleClick = useRef(() => setOpen(open => !open)).current
  return (
    <section className={css.container} onClick={handleClick}>
      {open ? (
        <Card>
          <CardContent className={css.card}>
            <h3 className={css.heading}>Media</h3>
            <section className={css.group}>
              <Shortcut keys="Ctrl + space" action="Play/pause" />
              <Shortcut keys="Ctrl + L" action="Toggle loop" />
            </section>

            <section className={css.group}>
              <h3 className={css.heading}>Navigate between clips</h3>
              <Shortcut keys="Ctrl + ," action="Select previous clip" />
              <Shortcut keys="Ctrl + ." action="Select next clip" />
              <Shortcut keys="Esc" action="Deselect current clip" />
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
