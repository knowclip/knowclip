import React, { useCallback } from 'react'
import { IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core'
import { MoreVert } from '@material-ui/icons'
import { useDispatch } from 'react-redux'
import css from './FlashcardSection.module.css'
import usePopover from '../utils/usePopover'
import * as actions from '../actions'

enum $ {
  openMenuButton = 'flashcard-form-field-menu-open-button',
  menuItem = 'flashcard-form-field-menu-item',
}

const FlashcardSectionFormFieldPopoverMenu = ({
  embeddedSubtitlesTracks,
  externalSubtitlesTracks,
  linkedSubtitlesTrack,
  mediaFileId,
  fieldName,
}: {
  embeddedSubtitlesTracks: MediaFile['subtitles']
  externalSubtitlesTracks: MediaFile['subtitles']
  linkedSubtitlesTrack: string | null
  mediaFileId: MediaFileId
  fieldName: TransliterationFlashcardFieldName
}) => {
  const subtitlesPopover = usePopover()

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
          className={css.fieldMenuButton}
          buttonRef={subtitlesPopover.anchorCallbackRef}
          onClick={subtitlesPopover.open}
          id={$.openMenuButton}
        >
          <MoreVert />
        </IconButton>
      </Tooltip>
      {subtitlesPopover.isOpen && (
        <Menu
          anchorEl={subtitlesPopover.anchorEl}
          open={subtitlesPopover.isOpen}
          onClose={subtitlesPopover.close}
        >
          {embeddedSubtitlesTracks.map((track, i) => (
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
          {externalSubtitlesTracks.map((track, i) => (
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
        </Menu>
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
  closeMenu: (
    event?:
      | {
          stopPropagation: () => void
        }
      | undefined
  ) => void
}) => {
  const dispatch = useDispatch()
  const handleClick = useCallback(
    e => {
      dispatch(
        actions.linkFlashcardFieldToSubtitlesTrack(
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
    <MenuItem onClick={handleClick} selected={selected} id={$.menuItem}>
      {label}
    </MenuItem>
  )
}

export default FlashcardSectionFormFieldPopoverMenu

export { $ as flashcardFormFieldMenu$ }
