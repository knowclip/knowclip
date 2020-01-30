import React, { useCallback, useMemo, memo } from 'react'
import { TextField } from '@material-ui/core'
import { OutlinedInputProps } from '@material-ui/core/OutlinedInput'
import css from './FlashcardSection.module.css'
import FieldMenu from './FlashcardSectionFormFieldPopoverMenu'
import { flashcardSectionForm$ } from './FlashcardSectionForm'

type Props = {
  name: FlashcardFieldName
  mediaFileId: MediaFileId
  currentFlashcard: Flashcard
  label: string
  setFlashcardText: (id: string, text: string) => void
  subtitles: MediaFile['subtitles']
  linkedSubtitlesTrack: string | null
  inputProps?: OutlinedInputProps['inputProps']
  onKeyPress: () => void
  autoFocus: boolean
}
const FlashcardSectionFormField = memo(
  ({
    name,
    mediaFileId,
    currentFlashcard,
    label: fieldLabel,
    setFlashcardText,
    subtitles,
    linkedSubtitlesTrack,
    inputProps,
    onKeyPress,
    autoFocus,
  }: Props) => {
    const handleChange = useCallback(
      e => setFlashcardText(name, e.target.value),
      [setFlashcardText, name]
    )
    const embeddedSubtitlesTracks = useMemo(
      () => subtitles.filter(isEmbedded),
      [subtitles]
    )
    const externalSubtitlesTracks = useMemo(
      () => subtitles.filter(isExternal),
      [subtitles]
    )
    const label = useMemo(
      () =>
        fieldLabel +
        getLinkedTrackLabel(
          embeddedSubtitlesTracks,
          externalSubtitlesTracks,
          linkedSubtitlesTrack
        ),
      [
        fieldLabel,
        embeddedSubtitlesTracks,
        externalSubtitlesTracks,
        linkedSubtitlesTrack,
      ]
    )

    return (
      <section className={css.field}>
        {Boolean(subtitles.length) && (
          <FieldMenu
            embeddedSubtitlesTracks={embeddedSubtitlesTracks}
            externalSubtitlesTracks={externalSubtitlesTracks}
            linkedSubtitlesTrack={linkedSubtitlesTrack}
            mediaFileId={mediaFileId}
            fieldName={name as TransliterationFlashcardFieldName}
          />
        )}
        <TextField
          autoFocus={autoFocus}
          className={flashcardSectionForm$.flashcardFields}
          inputProps={inputProps}
          onChange={handleChange}
          onKeyPress={onKeyPress}
          value={
            name in currentFlashcard.fields
              ? (currentFlashcard.fields as Record<
                  TransliterationFlashcardFieldName,
                  string
                >)[name]
              : ''
          }
          fullWidth
          multiline
          margin="dense"
          label={label}
        />
      </section>
    )
  }
)

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

const getLinkedTrackLabel = (
  embedded: MediaFile['subtitles'],
  external: MediaFile['subtitles'],
  linkedTrackId: string | null
) => {
  if (!linkedTrackId) return ''

  const embeddedIndex = embedded.findIndex(t => t.id === linkedTrackId)
  if (embeddedIndex !== -1)
    return ` (Embedded subtitles track ${embeddedIndex + 1})`

  const externalIndex = external.findIndex(t => t.id === linkedTrackId)
  if (externalIndex !== -1)
    return ` (External subtitles track ${externalIndex + 1})`

  return ''
}

export default FlashcardSectionFormField
