import React, { useRef, useState, useCallback } from 'react'
import cn from 'classnames'
import { MenuItem, Paper, Chip } from '@material-ui/core'
import ChipInput, { ChipRenderer } from 'material-ui-chip-input'
import css from './FlashcardSection.module.css'
import Autosuggest, {
  RenderSuggestion,
  GetSuggestionValue,
  RenderSuggestionsContainer,
  InputProps,
} from 'react-autosuggest'
import { blue } from '@material-ui/core/colors'
import truncate from '../utils/truncate'

enum $ {
  container = 'tags-input-container',
  tagChip = 'tags-input-tag-chip',
  inputField = 'tags-input-field',
}

const getSuggestionValue: GetSuggestionValue<string> = (a) => a
const preventDefault = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
  e.preventDefault()
}

const renderSuggestion: RenderSuggestion<string> = (
  suggestion,
  { query, isHighlighted, ...other }
) => (
  // prevent the click causing the input to be blurred
  <MenuItem
    selected={isHighlighted}
    onMouseDown={preventDefault}
    id={`tag__${suggestion}`}
    {...other}
  >
    {suggestion}
  </MenuItem>
)

const TagsInput = ({
  allTags,
  tags,
  onAddChip,
  onDeleteChip,
  onFocus,
}: {
  allTags: string[]
  tags: string[]
  onAddChip: (text: string) => void
  onDeleteChip: (index: number, text: string) => void
  onFocus?: (event: any) => void
}) => {
  const autosuggestComponent = useRef<Autosuggest<string, any>>(null)

  const [textFieldInput, setTextFieldInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])

  const handletextFieldInputChange = useCallback(
    (e, { newValue }) => setTextFieldInput(newValue),
    [setTextFieldInput]
  )

  const handleAddChip = useCallback(
    (text) => {
      setTextFieldInput('')
      onAddChip(text)
    },
    [setTextFieldInput, onAddChip]
  )
  const handleDeleteChip = useCallback(
    (text, index) => {
      onDeleteChip(index, text)
      if (autosuggestComponent.current && autosuggestComponent.current.input)
        autosuggestComponent.current.input.focus()
    },
    [onDeleteChip, autosuggestComponent]
  )

  const onSuggestionHighlighted = useCallback(({ suggestion }) => {
    const el =
      suggestion && document.querySelector(`#tag__${suggestion}:not(:hover)`)
    if (el) {
      el.scrollIntoView(false)
    }
  }, [])

  const onSuggestionSelected = useCallback(
    (e, { suggestionValue }) => {
      handleAddChip(suggestionValue)
      e.preventDefault()
    },
    [handleAddChip]
  )

  const getSuggestions = useCallback(
    (value) => {
      const inputValue = value.trim().toLowerCase()

      return inputValue.length === 0
        ? []
        : allTags.filter((tag) => tag.toLowerCase().startsWith(inputValue))
    },
    [allTags]
  )
  const onSuggestionsFetchRequested = useCallback(
    ({ value }) => setSuggestions(getSuggestions(value)),
    [setSuggestions, getSuggestions]
  )

  const onSuggestionsClearRequested = () => setSuggestions([])

  const renderSuggestionsContainer: RenderSuggestionsContainer = ({
    children,
    containerProps,
  }) => (
    <Paper {...containerProps} square className={css.suggestionsContainer}>
      {children}
    </Paper>
  )

  return (
    <Autosuggest
      ref={autosuggestComponent}
      theme={{
        suggestionsList: css.suggestionsList,
        suggestionsContainer: css.suggestionsContainer,
      }}
      suggestions={suggestions}
      onSuggestionHighlighted={onSuggestionHighlighted}
      onSuggestionSelected={onSuggestionSelected}
      onSuggestionsFetchRequested={onSuggestionsFetchRequested}
      onSuggestionsClearRequested={onSuggestionsClearRequested}
      renderSuggestionsContainer={renderSuggestionsContainer}
      getSuggestionValue={getSuggestionValue}
      renderSuggestion={renderSuggestion}
      focusInputOnSuggestionClick={false}
      shouldRenderSuggestions={useCallback(
        (value) => value && value.trim().length > 0,
        []
      )}
      inputProps={
        {
          chips: tags || [],
          value: textFieldInput,
          onChange: handletextFieldInputChange,
          onAdd: handleAddChip,
          onDelete: handleDeleteChip,
          InputProps: { inputProps: { className: $.inputField, onFocus } },
        } as InputProps<string>
      }
      renderInputComponent={useCallback(
        ({ value, onChange, chips, ref, ...other }) => (
          <ChipInput
            margin="dense"
            label="Tags"
            placeholder="Type your tag and press 'enter'"
            className={cn(css.tagsField, $.container)}
            fullWidth
            onAdd={handleAddChip}
            onDelete={handleDeleteChip}
            dataSource={allTags}
            newChipKeyCodes={[13, 9, 32] /* enter tab space */}
            onUpdateInput={onChange}
            value={chips}
            clearInputValueOnChange
            inputRef={ref}
            chipRenderer={chipRenderer}
            onFocus={onFocus}
            blurBehavior="add"
            {...other}
          />
        ),
        [handleAddChip, handleDeleteChip, allTags, onFocus]
      )}
    />
  )
}

const chipRenderer: ChipRenderer = (
  { text, isFocused, isDisabled, handleClick, handleDelete, className },
  key
) => (
  <Chip
    key={key}
    className={cn(className, $.tagChip)}
    style={{
      pointerEvents: isDisabled ? 'none' : undefined,
      backgroundColor: isFocused ? blue[300] : undefined,
    }}
    onClick={handleClick}
    onDelete={handleDelete}
    label={truncate(text, 12)}
    title={text}
  />
)

export default TagsInput

export { $ as tagsInput$ }
