import React, { useCallback, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  TextField,
  IconButton,
  Card,
  CardContent,
  Menu,
  MenuItem,
  Tooltip,
} from '@material-ui/core'
import { Delete as DeleteIcon, Loop, MoreVert } from '@material-ui/icons'
import formatTime from '../utils/formatTime'
import cn from 'classnames'
import * as r from '../redux'
import css from './FlashcardSection.module.css'
import {
  ChevronLeft,
  ChevronRight,
  Subtitles,
  Hearing,
  Layers,
} from '@material-ui/icons'
import { getNoteTypeFields } from '../utils/noteType'
import TagsInput from './TagsInput'
import usePopover from '../utils/usePopover'
import * as actions from '../actions'
import { OutlinedInputProps } from '@material-ui/core/OutlinedInput'

export const testLabels = {
  container: 'flashcard-section-container',
  flashcardFields: 'flashcard-field',
  previousClipButton: 'previous-clip-button',
} as const

type FieldMenuProps = {
  embeddedSubtitlesTracks: EmbeddedSubtitlesTrack[]
  externalSubtitlesTracks: ExternalSubtitlesTrack[]
  linkToSubtitlesTrack: (trackId: string | null) => void
  linkedSubtitlesTrack: string | null
}
const FieldMenu = ({
  embeddedSubtitlesTracks,
  externalSubtitlesTracks,
  linkToSubtitlesTrack,
  linkedSubtitlesTrack,
}: FieldMenuProps) => {
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
          tabIndex={-1}
          className={css.fieldMenuButton}
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
          {embeddedSubtitlesTracks.map((track: EmbeddedSubtitlesTrack, i) => {
            const selected = linkedSubtitlesTrack === track.id
            return (
              <MenuItem
                onClick={() => linkToSubtitlesTrack(selected ? null : track.id)}
                selected={selected}
              >
                Embedded subtitles track {i + 1}
              </MenuItem>
            )
          })}
          {externalSubtitlesTracks.map((track, i) => {
            const selected = linkedSubtitlesTrack === track.id
            return (
              <MenuItem
                onClick={() => linkToSubtitlesTrack(selected ? null : track.id)}
                selected={selected}
              >
                External subtitles track {i + 1}
              </MenuItem>
            )
          })}
          ))}
        </Menu>
      )}
    </React.Fragment>
  )
}

const capitalize = (string: string) =>
  string.substring(0, 1).toUpperCase() + string.slice(1)

const getSubtitlesTrackLabel = (
  embedded: EmbeddedSubtitlesTrack[],
  external: ExternalSubtitlesTrack[],
  trackId: string
) => {
  const embeddedIndex = embedded.findIndex(t => t.id === trackId)
  return embeddedIndex !== -1
    ? `Embedded subtitles track ${embeddedIndex + 1}`
    : `External subtitles track ${external.findIndex(t => t.id === trackId) +
        1}`
}

type FieldProps = {
  id: FlashcardFieldName
  currentFlashcard: Flashcard
  name: string
  setFlashcardText: (id: string, text: string) => void
  embeddedSubtitlesTracks: EmbeddedSubtitlesTrack[]
  externalSubtitlesTracks: ExternalSubtitlesTrack[]
  linkedSubtitlesTrack: string | null
  linkToSubtitlesTrack: (trackId: string | null) => void
  inputProps?: OutlinedInputProps['inputProps']
}
const Field = ({
  id,
  currentFlashcard,
  name,
  setFlashcardText,
  embeddedSubtitlesTracks,
  externalSubtitlesTracks,
  linkedSubtitlesTrack,
  linkToSubtitlesTrack,
  inputProps,
}: FieldProps) => {
  const handleChange = useCallback(e => setFlashcardText(id, e.target.value), [
    setFlashcardText,
    id,
  ])

  const linkedTrackName = linkedSubtitlesTrack
    ? `—${getSubtitlesTrackLabel(
        embeddedSubtitlesTracks,
        externalSubtitlesTracks,
        linkedSubtitlesTrack
      )}`
    : ''

  return (
    <section className={css.field}>
      {Boolean(
        embeddedSubtitlesTracks.length + externalSubtitlesTracks.length
      ) && (
        <FieldMenu
          {...{
            embeddedSubtitlesTracks,
            externalSubtitlesTracks,
            linkToSubtitlesTrack,
            linkedSubtitlesTrack,
          }}
        />
      )}
      <TextField
        inputProps={inputProps}
        onChange={handleChange}
        value={
          id in currentFlashcard.fields
            ? (currentFlashcard.fields as Record<
                TransliterationFlashcardFieldName,
                string
              >)[id]
            : ''
        }
        fullWidth
        multiline
        margin="dense"
        label={name + linkedTrackName}
      />
    </section>
  )
}

const CurrentFlashcard = () => {
  const dispatch = useDispatch()
  const {
    allTags,
    currentFlashcard,
    currentMediaFileId,
    highlightedClipId,
    selectedClipTime,
    currentNoteType,
    isLoopOn,

    embeddedSubtitlesTracks,
    externalSubtitlesTracks,
    subtitlesFlashcardFieldLinks,
  } = useSelector((state: AppState) => ({
    allTags: r.getAllTags(state),
    currentFlashcard: r.getCurrentFlashcard(state),
    currentMediaFileId: r.getCurrentFileId(state),
    selectedClipTime: r.getSelectedClipTime(state),
    highlightedClipId: r.getHighlightedClipId(state),
    currentNoteType: r.getCurrentNoteType(state),
    isLoopOn: r.isLoopOn(state),

    embeddedSubtitlesTracks: r.getEmbeddedSubtitlesTracks(state),
    externalSubtitlesTracks: r.getExternalSubtitlesTracks(state),
    subtitlesFlashcardFieldLinks: r.getSubtitlesFlashcardFieldLinks(state),
  }))

  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState(null)

  const toggleLoop = useCallback(() => dispatch(actions.toggleLoop()), [
    dispatch,
  ])
  const handleCloseMoreMenu = useCallback(
    () => {
      setMoreMenuAnchorEl(null)
    },
    [setMoreMenuAnchorEl]
  )

  const handleClickDeleteButton = useCallback(
    () => {
      if (highlightedClipId)
        dispatch(
          actions.confirmationDialog(
            'Are you sure you want to delete this clip and flashcard?',
            actions.deleteCard(highlightedClipId)
          )
        )
    },
    [dispatch, highlightedClipId]
  )

  const handleFlashcardSubmit = useCallback(e => {
    e.preventDefault()
  }, [])

  const setFlashcardText = useCallback(
    (key, text) => {
      if (highlightedClipId)
        dispatch(actions.setFlashcardField(highlightedClipId, key, text))
    },
    [dispatch, highlightedClipId]
  )
  const deleteCard = () => {
    if (highlightedClipId) {
      dispatch(actions.deleteCard(highlightedClipId))
    }
  }

  if (
    !highlightedClipId ||
    !selectedClipTime ||
    !currentFlashcard ||
    !currentMediaFileId
  )
    throw new Error('Clip not found')

  const onAddChip = useCallback(
    (text: string) =>
      dispatch(actions.addFlashcardTag(highlightedClipId, text)),
    [dispatch, highlightedClipId]
  )
  const onDeleteChip = useCallback(
    (index, text) =>
      dispatch(actions.deleteFlashcardTag(highlightedClipId, index, text)),
    [dispatch, highlightedClipId]
  )

  return (
    <CardContent>
      <form className="form" onSubmit={handleFlashcardSubmit}>
        <div className="formBody">
          <section className={css.timeStamp}>
            {formatTime(selectedClipTime.start)}
            {' - '}
            {formatTime(selectedClipTime.end)}
            <Tooltip title="Loop audio (Ctrl + L)">
              <IconButton
                onClick={toggleLoop}
                color={isLoopOn ? 'secondary' : 'default'}
              >
                <Loop />
              </IconButton>
            </Tooltip>
          </section>
          {currentNoteType &&
            getNoteTypeFields(currentNoteType).map(id => (
              <Field
                key={`${id}_${currentFlashcard.id}`}
                id={id}
                currentFlashcard={currentFlashcard}
                name={capitalize(id)}
                setFlashcardText={setFlashcardText}
                embeddedSubtitlesTracks={embeddedSubtitlesTracks}
                externalSubtitlesTracks={externalSubtitlesTracks}
                linkedSubtitlesTrack={subtitlesFlashcardFieldLinks[id] || null}
                linkToSubtitlesTrack={trackId =>
                  dispatch(
                    actions.linkFlashcardFieldToSubtitlesTrack(
                      id,
                      currentMediaFileId,
                      trackId
                    )
                  )
                }
                inputProps={{ className: testLabels.flashcardFields }}
              />
            ))}
          <TagsInput
            allTags={allTags}
            tags={currentFlashcard.tags}
            onAddChip={onAddChip}
            onDeleteChip={onDeleteChip}
          />

          <section className={css.bottom}>
            <IconButton
              className={css.moreMenuButton}
              onClick={handleClickDeleteButton}
            >
              <DeleteIcon />
            </IconButton>
            <Menu
              anchorEl={moreMenuAnchorEl}
              open={Boolean(moreMenuAnchorEl)}
              onClose={handleCloseMoreMenu}
            >
              <MenuItem onClick={deleteCard}>Delete card</MenuItem>
            </Menu>
          </section>
        </div>
      </form>
    </CardContent>
  )
}

const Placeholder = () => (
  <CardContent className={css.intro}>
    <p className={css.introText}>
      You can <strong>create clips</strong> in a few different ways:
    </p>
    <ul className={css.introList}>
      <li>
        Manually <strong>click and drag</strong> on the waveform
      </li>

      <li>
        Use <Hearing className={css.icon} /> <strong>silence detection</strong>{' '}
        to automatically make clips from audio containing little background
        noise.
      </li>
      <li>
        Use <Subtitles className={css.icon} /> <strong>subtitles</strong> to
        automatically create both clips and flashcards.
      </li>
    </ul>
    <p className={css.introText}>
      When you're done, press the <Layers className={css.icon} />{' '}
      <strong>export button</strong>.
    </p>
  </CardContent>
)

const FlashcardSection = ({ showing }: { showing: boolean }) => {
  const { prevId, nextId } = useSelector((state: AppState) => ({
    prevId: r.getFlashcardIdBeforeCurrent(state),
    nextId: r.getFlashcardIdAfterCurrent(state),
  }))
  const dispatch = useDispatch()

  return (
    <section className={cn(css.container, testLabels.container)}>
      <Tooltip title="Previous clip (Ctrl + comma)">
        <span>
          <IconButton
            className={cn(css.navButton, testLabels.previousClipButton)}
            disabled={!prevId}
            onClick={useCallback(
              () => dispatch(actions.highlightClip(prevId)),
              [dispatch, prevId]
            )}
          >
            <ChevronLeft />
          </IconButton>
        </span>
      </Tooltip>
      <Card className={css.form}>
        {showing ? <CurrentFlashcard /> : <Placeholder />}
      </Card>
      <Tooltip title="Next clip (Ctrl + period)">
        <span>
          <IconButton
            className={css.navButton}
            disabled={!nextId}
            onClick={useCallback(
              () => dispatch(actions.highlightClip(nextId)),
              [dispatch, nextId]
            )}
          >
            <ChevronRight />
          </IconButton>
        </span>
      </Tooltip>
    </section>
  )
}

export default FlashcardSection
