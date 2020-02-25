import React, { useCallback, SyntheticEvent, useMemo } from 'react'
import { IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core'
import { MoreVert } from '@material-ui/icons'
import { useDispatch } from 'react-redux'
import cn from 'classnames'
import usePopover from '../utils/usePopover'
import * as actions from '../actions'

enum $ {
  openMenuButton = 'flashcard-field-menu-open-button',
  menuItem = 'flashcard-field-menu-item',
}

const FlashcardSectionFieldPopoverMenu = ({
  embeddedSubtitlesTracks,
  externalSubtitlesTracks,
  linkedSubtitlesTrack,
  mediaFileId,
  fieldName,
  className,
}: {
  embeddedSubtitlesTracks: MediaFile['subtitles']
  externalSubtitlesTracks: MediaFile['subtitles']
  linkedSubtitlesTrack: string | null
  mediaFileId: MediaFileId
  fieldName: TransliterationFlashcardFieldName
  className: string
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
          className={cn(className, $.openMenuButton)}
          buttonRef={subtitlesPopover.anchorCallbackRef}
          onClick={subtitlesPopover.open}
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
    <MenuItem onClick={handleClick} selected={selected} className={$.menuItem}>
      {label}
    </MenuItem>
  )
}

export function useSubtitlesBySource(subtitles: MediaSubtitlesRelation[]) {
  const embeddedSubtitlesTracks = useMemo(() => subtitles.filter(isEmbedded), [
    subtitles,
  ])
  const externalSubtitlesTracks = useMemo(() => subtitles.filter(isExternal), [
    subtitles,
  ])
  return { embeddedSubtitlesTracks, externalSubtitlesTracks }
}

const isEmbedded = (
  t:
    | {
        type: 'EmbeddedSubtitlesTrack'
        id: string
        streamIndex: number
      }
    | {
        type: 'ExternalSubtitlesTrack'
        id: string
      }
): t is {
  type: 'EmbeddedSubtitlesTrack'
  id: string
  streamIndex: number
} => t.type === 'EmbeddedSubtitlesTrack'
const isExternal = (
  t:
    | {
        type: 'EmbeddedSubtitlesTrack'
        id: string
        streamIndex: number
      }
    | {
        type: 'ExternalSubtitlesTrack'
        id: string
      }
): t is {
  type: 'ExternalSubtitlesTrack'
  id: string
} => t.type === 'ExternalSubtitlesTrack'

export default FlashcardSectionFieldPopoverMenu

export { $ as flashcardFieldMenu$ }
