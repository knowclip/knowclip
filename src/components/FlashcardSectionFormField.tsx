import React, { useCallback, useMemo, memo, MutableRefObject } from 'react'
import { TextField } from '@material-ui/core'
import { OutlinedInputProps } from '@material-ui/core/OutlinedInput'
import css from './FlashcardSection.module.css'
import FieldMenu, {
  useSubtitlesBySource,
} from './FlashcardSectionFormFieldPopoverMenu'
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
  onFocus: (event: any) => void
  autoFocus?: boolean
  inputRef?: MutableRefObject<HTMLInputElement | undefined>
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
    autoFocus = false,
    onFocus,
    inputRef,
  }: Props) => {
    const handleChange = useCallback(
      e => setFlashcardText(name, e.target.value),
      [setFlashcardText, name]
    )
    const {
      embeddedSubtitlesTracks,
      externalSubtitlesTracks,
    } = useSubtitlesBySource(subtitles)
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
          onFocus={onFocus}
          name={name}
          inputRef={inputRef}
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
