import React, { useCallback, SyntheticEvent } from 'react'
import {
  IconButton,
  MenuItem,
  Tooltip,
  MenuList,
  Popover,
} from '@material-ui/core'
import { MoreVert } from '@material-ui/icons'
import { useDispatch, useSelector } from 'react-redux'
import cn from 'classnames'
import usePopover from '../utils/usePopover'
import * as actions from '../actions'
import css from './FlashcardSection.module.css'
import { getSubtitlesFilesWithTracks } from '../selectors'

enum $ {
  openMenuButtons = 'flashcard-field-menu-open-button',
  menuItem = 'flashcard-field-menu-item',
}

const FlashcardSectionFieldPopoverMenu = ({
  linkedSubtitlesTrack,
  mediaFileId,
  fieldName,
  className,
}: {
  linkedSubtitlesTrack: string | null
  mediaFileId: MediaFileId
  fieldName: TransliterationFlashcardFieldName
  className: string
}) => {
  const subtitlesPopover = usePopover()

  const { subtitles } = useSelector((state: AppState) => ({
    subtitles: getSubtitlesFilesWithTracks(state),
  }))

  return (
    <React.Fragment>
      <Tooltip
        title={
          linkedSubtitlesTrack
            ? 'Link/unlink subtitles track'
            : 'Link subtitles track'
        }
      >
        <IconButton
          tabIndex={1}
          className={cn(className, $.openMenuButtons)}
          buttonRef={subtitlesPopover.anchorCallbackRef}
          onClick={subtitlesPopover.open}
        >
          <MoreVert />
        </IconButton>
      </Tooltip>
      {subtitlesPopover.isOpen && subtitlesPopover.anchorEl && (
        <Popover
          anchorEl={subtitlesPopover.anchorEl}
          open={subtitlesPopover.isOpen}
          onClose={subtitlesPopover.close}
        >
          <MenuList>
            {subtitles.embedded.map((track, i) => (
              <FieldMenuItem
                key={track.id}
                trackId={track.id}
                label={`Embedded subtitles track ${i + 1}`}
                selected={linkedSubtitlesTrack === track.id}
                mediaFileId={mediaFileId}
                fieldName={fieldName}
                closeMenu={subtitlesPopover.close}
              />
            ))}
            {subtitles.external.map((track, i) => (
              <FieldMenuItem
                key={track.id}
                trackId={track.id}
                label={`External subtitles track ${i + 1}`}
                selected={linkedSubtitlesTrack === track.id}
                mediaFileId={mediaFileId}
                fieldName={fieldName}
                closeMenu={subtitlesPopover.close}
              />
            ))}
          </MenuList>
        </Popover>
      )}
    </React.Fragment>
  )
}

const FieldMenuItem = ({
  trackId,
  selected,
  label,
  mediaFileId,
  fieldName,
  closeMenu,
}: {
  trackId: string
  selected: boolean
  label: string
  mediaFileId: MediaFileId
  fieldName: TransliterationFlashcardFieldName
  closeMenu: (e: SyntheticEvent) => void
}) => {
  const dispatch = useDispatch()
  const handleClick = useCallback(
    e => {
      dispatch(
        actions.linkFlashcardFieldToSubtitlesTrackRequest(
          fieldName,
          mediaFileId,
          selected ? null : trackId
        )
      )
      closeMenu(e)
    },
    [dispatch, selected, trackId, fieldName, mediaFileId, closeMenu]
  )
  return (
    <MenuItem
      onClick={handleClick}
      autoFocus={selected}
      tabIndex={0}
      className={cn($.menuItem, { [css.selectedMenuItem]: selected })}
    >
      {label}
    </MenuItem>
  )
}

export default FlashcardSectionFieldPopoverMenu

export { $ as flashcardFieldMenu$ }
