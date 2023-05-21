import React, {
  useCallback,
  useMemo,
  memo,
  MutableRefObject,
  useEffect,
  useRef,
  ChangeEventHandler,
} from 'react'
import { TextField } from '@mui/material'
import { OutlinedInputProps } from '@mui/material/OutlinedInput'
import css from './FlashcardSection.module.css'
import FieldMenu from './FlashcardSectionFieldPopoverMenu'
import { flashcardSectionForm$, capitalize } from './FlashcardSectionForm'
import cn from 'classnames'
import { MediaSubtitles } from '../selectors/subtitles'
import { useSelector } from 'react-redux'
import { usePrevious } from '../utils/usePrevious'

export type Props = {
  name: FlashcardFieldName
  mediaFileId: MediaFileId
  currentFlashcard: Flashcard
  setFlashcardText: (
    id: FlashcardFieldName,
    text: string,
    caretLocation: number
  ) => void
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
    className,
  }: Props) => {
    const inputRef = useRef<HTMLInputElement>()
    const caretLocation = useRef<number | null>(null)
    const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
      (e) => {
        caretLocation.current = e.target.selectionEnd! // TODO: investigate if might not be null
        setFlashcardText(name, e.target.value, caretLocation.current)
      },
      [setFlashcardText, name]
    )

    const label = useMemo(() => {
      const track = subtitles.all.find((s) => s.id === linkedSubtitlesTrack)

      return track ? `${capitalize(name)} (${track.label})` : capitalize(name)
    }, [subtitles.all, name, linkedSubtitlesTrack])

    const text =
      name in currentFlashcard.fields
        ? (
            currentFlashcard.fields as Record<
              TransliterationFlashcardFieldName,
              string
            >
          )[name]
        : ''

    const registeredCaretLocation = useSelector((s: WithHistory<AppState>) => {
      const action = s.lastHistoryAction
      if (action && action.type === 'setFlashcardField' && action.key === name)
        return action.caretLocation

      return null
    })
    const previousText = usePrevious(text)
    useEffect(() => {
      if (
        inputRef?.current &&
        text !== previousText &&
        registeredCaretLocation !== null &&
        registeredCaretLocation !== caretLocation.current
      ) {
        inputRef.current.focus()
        inputRef.current.selectionStart = registeredCaretLocation
        inputRef.current.selectionEnd = registeredCaretLocation
      }
    }, [text, previousText, registeredCaretLocation, inputRef])

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
          value={text}
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
