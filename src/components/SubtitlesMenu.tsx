import React, {
  EventHandler,
  Fragment,
  MouseEventHandler,
  useCallback,
  useMemo,
} from 'react'
import {
  Subtitles as SubtitlesIcon,
  Visibility as VisibilityOnIcon,
  VisibilityOff as VisibilityOffIcon,
  MoreVert,
  FolderSpecial,
  Link,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import * as selectors from '../selectors'
import { actions } from '../actions'
import {
  IconButton,
  Icon,
  Tooltip,
  Menu,
  MenuItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  Divider,
  MenuList,
  Popover,
} from '@mui/material'
import { showOpenDialog } from '../mockable/electron'
import css from './MainHeader.module.css'
import usePopover from '../utils/usePopover'

import { subtitlesMenu$ as $ } from './SubtitlesMenu.testLabels'
import { AnyAction, Dispatch } from 'redux'

const SubtitlesMenu = () => {
  const { anchorEl, anchorCallbackRef, open, close, isOpen } = usePopover()

  const { subtitles, currentFileId, fieldNamesToTrackIds } = useSelector(
    (state: AppState) => {
      const currentFileId = selectors.getCurrentFileId(state)
      return {
        subtitles: selectors.getSubtitlesFilesWithTracks(state),
        currentFileId,
        fieldNamesToTrackIds: selectors.getSubtitlesFlashcardFieldLinks(state),
      }
    }
  )

  const trackIdsToFieldNames = useMemo(
    () =>
      Object.entries(fieldNamesToTrackIds).reduce(
        (map, [fieldName, trackId]) => {
          if (fieldName)
            map[trackId as SubtitlesTrackId] =
              fieldName as TransliterationFlashcardFieldName
          return map
        },
        {} as Record<
          SubtitlesTrackId,
          TransliterationFlashcardFieldName | undefined
        >
      ),
    [fieldNamesToTrackIds]
  )

  const dispatch = useDispatch()
  const loadExternalTrack: MouseEventHandler = useCallback(
    async (e) => {
      if (!currentFileId)
        return dispatch(
          actions.simpleMessageSnackbar('Please open a media file first.')
        )

      const filePaths = await showOpenDialog([
        { name: 'Subtitles', extensions: ['srt', 'ass', 'vtt'] },
      ])
      if (!filePaths) return

      dispatch(actions.loadNewSubtitlesFile(filePaths[0], currentFileId))

      close(e)
    },
    [dispatch, currentFileId, close]
  )
  const subtitlesClipsDialogRequest: MouseEventHandler = useCallback(
    (e) => {
      dispatch(actions.showSubtitlesClipsDialogRequest())
      close(e)
    },
    [dispatch, close]
  )

  return (
    <Fragment>
      <Tooltip title="Subtitles">
        <IconButton
          ref={anchorCallbackRef}
          onClick={open}
          id={$.openMenuButton}
        >
          <SubtitlesIcon />
        </IconButton>
      </Tooltip>
      {isOpen && (
        <Popover anchorEl={anchorEl} open={isOpen} onClose={close}>
          <MenuList className={$.container}>
            {!subtitles.total && (
              <MenuItem dense disabled>
                No subtitles loaded.
              </MenuItem>
            )}
            {subtitles.embedded.map(
              ({ relation, sourceFile: file, track, label }) => (
                <EmbeddedTrackMenuItem
                  key={relation.id}
                  id={relation.id}
                  file={
                    file as
                      | (VttConvertedSubtitlesFile & {
                          parentType: 'MediaFile'
                        })
                      | null
                  }
                  track={track}
                  title={label}
                  currentFileId={currentFileId}
                  linkedFieldTitle={
                    track ? trackIdsToFieldNames[track.id] : undefined
                  }
                />
              )
            )}
            {subtitles.external.map(({ relation, sourceFile, track }, i) => (
              <ExternalTrackMenuItem
                key={relation.id}
                id={relation.id}
                track={track}
                file={sourceFile}
                title={sourceFile?.name || `External track ${i + 1}`}
                currentFileId={currentFileId}
                linkedFieldTitle={
                  track ? trackIdsToFieldNames[track.id] : undefined
                }
              />
            ))}
            <Divider />
            <MenuItem
              dense
              onClick={loadExternalTrack}
              className={$.addTrackButton}
            >
              <ListItemText primary="Load external track" />
            </MenuItem>
            <MenuItem
              dense
              onClick={subtitlesClipsDialogRequest}
              id={$.makeClipsAndCardsButton}
            >
              <ListItemText primary="Generate clips + cards from subtitles" />
            </MenuItem>
          </MenuList>
        </Popover>
      )}
    </Fragment>
  )
}

const VisibilityIcon = ({ visible }: { visible: boolean }) => (
  <Icon>
    <Tooltip
      title={
        visible
          ? 'Hide subtitles track in video'
          : 'Show subtitles track in video'
      }
    >
      {visible ? (
        <VisibilityOnIcon fontSize="small" />
      ) : (
        <VisibilityOffIcon fontSize="small" />
      )}
    </Tooltip>
  </Icon>
)

const EmbeddedTrackMenuItem = ({
  id,
  file,
  track,
  title,
  currentFileId,
  linkedFieldTitle,
}: {
  id: string
  file: (VttConvertedSubtitlesFile & { parentType: 'MediaFile' }) | null
  track: EmbeddedSubtitlesTrack | null
  title: string
  currentFileId: MediaFileId | null
  linkedFieldTitle: string | undefined
}) => {
  const { anchorEl, anchorCallbackRef, open, close, isOpen } = usePopover()
  const stopPropagation: EventHandler<any> = useCallback((e) => {
    e.stopPropagation()
  }, [])

  const dispatch = useDispatch()
  const linkSubtitlesDialog = useLinkSubtitlesDialogAction(
    track,
    file,
    dispatch,
    currentFileId
  )
  const handleClickLinkSubtitlesDialog: MouseEventHandler = useCallback(
    (e) => {
      linkSubtitlesDialog()
      close(e)
    },
    [close, linkSubtitlesDialog]
  )

  const { fileAvailability } = useSelector((state: AppState) => {
    return {
      fileAvailability: file && selectors.getFileAvailability(state, file),
    }
  })

  return (
    <>
      <MenuItem
        dense
        onClick={useToggleVisible(track, id)}
        className={$.trackMenuItems}
        autoFocus
      >
        <ListItemIcon>
          {track ? (
            <VisibilityIcon visible={Boolean(track.mode === 'showing')} />
          ) : (
            <Tooltip
              title={
                fileAvailability?.status === 'FAILED_TO_LOAD'
                  ? 'Problem reading embedded subtitles.'
                  : 'Loading embedded subtitles...'
              }
            >
              <FolderSpecial />
            </Tooltip>
          )}
        </ListItemIcon>
        <ListItemText
          className={css.subtitlesMenuListItemText}
          primary={title}
          secondary={linkedFieldTitle}
        />
        <Tooltip title="More actions">
          <ListItemSecondaryAction>
            <IconButton
              ref={anchorCallbackRef}
              onClick={open}
              className={$.openTrackSubmenuButton}
            >
              <MoreVert />
            </IconButton>
          </ListItemSecondaryAction>
        </Tooltip>
        {isOpen && (
          <Menu
            autoFocus
            open={isOpen}
            onClose={close}
            anchorEl={anchorEl}
            onKeyDown={stopPropagation}
            onKeyPress={stopPropagation}
            onClick={stopPropagation}
          >
            <MenuItem
              dense
              onClick={handleClickLinkSubtitlesDialog}
              disabled={!file}
            >
              <ListItemIcon>
                <Icon>
                  <Link />
                </Icon>
              </ListItemIcon>
              <ListItemText
                primary={
                  linkedFieldTitle
                    ? 'Link track to different flashcard field'
                    : 'Link track to a flashcard field'
                }
              />
            </MenuItem>
          </Menu>
        )}
      </MenuItem>
    </>
  )
}

const ExternalTrackMenuItem = ({
  id,
  file,
  track,
  title,
  currentFileId,
  linkedFieldTitle,
}: {
  id: SubtitlesTrackId
  file: ExternalSubtitlesFile | null
  track: ExternalSubtitlesTrack | null
  title: string
  currentFileId: string | null
  linkedFieldTitle: string | undefined
}) => {
  const { anchorEl, anchorCallbackRef, open, close, isOpen } = usePopover()
  const dispatch = useDispatch()

  const deleteExternalSubtitles: MouseEventHandler = useCallback(
    (e) => {
      dispatch(actions.deleteFileRequest('ExternalSubtitlesFile', id))
      close(e)
    },
    [dispatch, id, close]
  )

  const locateFileRequest: EventHandler<any> = useCallback(
    (e) => {
      if (file) {
        dispatch(
          actions.locateFileRequest(
            file,
            `Locate "${file.name}" in your filesystem to use these subtitles.`
          )
        )

        close(e)
      }
    },
    [dispatch, file, close]
  )

  const linkSubtitlesDialog = useLinkSubtitlesDialogAction(
    track,
    file,
    dispatch,
    currentFileId
  )
  const handleClickLinkSubtitlesDialog: MouseEventHandler = useCallback(
    (e) => {
      linkSubtitlesDialog()
      close(e)
    },
    [close, linkSubtitlesDialog]
  )
  const toggleVisible = useToggleVisible(track, id)

  const stopPropagation: EventHandler<any> = useCallback((e) => {
    e.stopPropagation()
  }, [])

  return (
    <MenuItem
      dense
      onClick={toggleVisible}
      disabled={!file}
      className={$.trackMenuItems}
    >
      <ListItemIcon>
        {track ? (
          <VisibilityIcon
            visible={Boolean(track && track.mode === 'showing')}
          />
        ) : (
          <Tooltip title="Not found in filesystem">
            <FolderSpecial />
          </Tooltip>
        )}
      </ListItemIcon>

      <ListItemText
        className={css.subtitlesMenuListItemText}
        primary={title}
        secondary={linkedFieldTitle}
      />

      <Tooltip title="More actions">
        <ListItemSecondaryAction>
          <IconButton
            ref={anchorCallbackRef}
            onClick={open}
            className={$.openTrackSubmenuButton}
          >
            <MoreVert />
          </IconButton>
        </ListItemSecondaryAction>
      </Tooltip>
      {isOpen && (
        <Menu
          autoFocus
          open={isOpen}
          onClose={close}
          anchorEl={anchorEl}
          onKeyDown={stopPropagation}
          onKeyPress={stopPropagation}
          onClick={stopPropagation}
          id={$.trackSubmenu}
        >
          <MenuItem
            dense
            onClick={handleClickLinkSubtitlesDialog}
            disabled={!file}
          >
            <ListItemIcon>
              <Icon>
                <Link />
              </Icon>
            </ListItemIcon>
            <ListItemText
              primary={
                linkedFieldTitle
                  ? 'Link track to different flashcard field'
                  : 'Link track to a flashcard field'
              }
            />
          </MenuItem>
          <MenuItem
            dense
            onClick={locateFileRequest}
            disabled={!file}
            id={$.locateExternalFileButton}
          >
            <ListItemIcon>
              <Icon>
                <FolderSpecial />
              </Icon>
            </ListItemIcon>
            <ListItemText primary="Locate subtitles file in filesystem" />
          </MenuItem>
          <MenuItem
            dense
            disabled={!file}
            onClick={deleteExternalSubtitles}
            id={$.deleteTrackButton}
          >
            <ListItemIcon>
              <Icon>
                <DeleteIcon />
              </Icon>
            </ListItemIcon>
            <ListItemText primary="Remove subtitles track" />
          </MenuItem>
        </Menu>
      )}
    </MenuItem>
  )
}

function useLinkSubtitlesDialogAction(
  track: SubtitlesTrack | null,
  file: VttFromEmbeddedSubtitles | ExternalSubtitlesFile | null,
  dispatch: Dispatch<AnyAction>,
  currentFileId: string | null
) {
  const chunks = track?.chunks
  const linkSubtitlesDialog = useCallback(() => {
    if (file && currentFileId) {
      dispatch(
        actions.linkSubtitlesDialog(file, chunks || [], currentFileId, false)
      )
    }
  }, [file, dispatch, chunks, currentFileId])
  return linkSubtitlesDialog
}

function useToggleVisible(track: SubtitlesTrack | null, id: string) {
  const dispatch = useDispatch()
  return useCallback(() => {
    if (track)
      dispatch(
        track.mode === 'showing'
          ? actions.hideSubtitles(id)
          : actions.showSubtitles(id)
      )
  }, [dispatch, id, track])
}

export default SubtitlesMenu
