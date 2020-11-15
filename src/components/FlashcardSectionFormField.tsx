import React, { useCallback, useMemo, memo, MutableRefObject } from 'react'
import { TextField } from '@material-ui/core'
import { OutlinedInputProps } from '@material-ui/core/OutlinedInput'
import css from './FlashcardSection.module.css'
import FieldMenu from './FlashcardSectionFieldPopoverMenu'
import { flashcardSectionForm$, capitalize } from './FlashcardSectionForm'
import cn from 'classnames'
import { MediaSubtitles } from '../selectors/subtitles'

type Props = {
  name: FlashcardFieldName
  mediaFileId: MediaFileId
  currentFlashcard: Flashcard
  setFlashcardText: (id: string, text: string, caretLocation: number) => void
  subtitles: MediaSubtitles
  linkedSubtitlesTrack: string | null
  inputProps?: OutlinedInputProps['inputProps']
  onKeyPress: () => void
  onFocus: (event: any) => void
  autoFocus?: boolean
  inputRef?: MutableRefObject<HTMLInputElement | undefined>
  className?: string
}
const FlashcardSectionFormField = memo(
  ({
    name,
    mediaFileId,
    currentFlashcard,
    setFlashcardText,
    subtitles,
    linkedSubtitlesTrack,
    inputProps,
    onKeyPress,
    autoFocus = false,
    onFocus,
    inputRef,
    className,
  }: Props) => {
    const handleChange = useCallback(
      (e) => setFlashcardText(name, e.target.value, e.target.selectionEnd),
      [setFlashcardText, name]
    )

    const label = useMemo(() => {
      const track = subtitles.all.find((s) => s.id === linkedSubtitlesTrack)

      return track ? `${capitalize(name)} (${track.label})` : capitalize(name)
    }, [subtitles.all, name, linkedSubtitlesTrack])

    return (
      <section className={cn(className, css.field)}>
        {Boolean(subtitles.all.length) && (
          <FieldMenu
            className={css.fieldMenuButton}
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

export default FlashcardSectionFormField
