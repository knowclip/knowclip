import React, { useCallback, useRef } from "react"
import css from "../pages/index.module.css"
import cn from "classnames"

const FaqSubsection = ({
  children,
  heading,
  id,
  isOpen,
  setOpenSections,
  className,
}) => {
  const open = useCallback(() => {
    setOpenSections(o => ({ ...o, [id]: true }))
    window.location.hash = "#" + id
  }, [setOpenSections, id])
  const close = useCallback(
    () => setOpenSections(o => ({ ...o, [id]: false })),
    [setOpenSections, id]
  )
  const headingRef = useRef()
  const skipFocusAction = useRef(false)
  const handleHeadingMouseDown = useCallback(() => {
    const notFocused =
      document.activeElement && headingRef.current !== document.activeElement

    if (notFocused && isOpen) {
      skipFocusAction.current = true
      close()
    } else {
      skipFocusAction.current = false

      if (isOpen) close()
      else open()
    }
  }, [isOpen, close, open])

  const handleFocus = useCallback(() => {
    if (!skipFocusAction.current && !isOpen) open()
  }, [isOpen, open])
  const handleHeadingClick = useCallback(() => {
    skipFocusAction.current = false
  }, [])

  return (
    <section
      className={cn(css.info, { [css.openInfo]: isOpen }, className)}
      id={id}
      tabIndex="0"
      onFocus={handleFocus}
    >
      <h2
        className={css.infoHeading}
        onMouseDown={handleHeadingMouseDown}
        onClick={handleHeadingClick}
        ref={headingRef}
      >
        {heading}
      </h2>
      <div className={css.infoBody}>{children}</div>
      {isOpen && (
        <p className={css.downloadLinkP}>
          <a href="#download" className={css.downloadLink} onClick={close}>
            Go to download &nbsp;&nbsp;↑
          </a>
        </p>
      )}
    </section>
  )
}

export default FaqSubsection
