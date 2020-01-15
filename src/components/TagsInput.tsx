import React, { useRef, useState, useCallback, ReactChild } from 'react'

import { MenuItem, Paper } from '@material-ui/core'
import ChipInput from 'material-ui-chip-input'
import css from './FlashcardSection.module.css'
import Autosuggest from 'react-autosuggest'
import { PaperProps } from '@material-ui/core/Paper'
import { MenuItemProps } from '@material-ui/core/MenuItem'

const getSuggestionValue = (a: string) => a
const preventDefault = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
  e.preventDefault()
}

const renderSuggestion = (
  suggestion: string,
  {
    query,
    isHighlighted,
    ...other
  }: { query: string; isHighlighted: boolean } & MenuItemProps
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
}: {
  allTags: string[]
  tags: string[]
  onAddChip: (text: string) => void
  onDeleteChip: (index: number, text: string) => void
}) => {
  const autosuggestComponent = useRef<{ input: HTMLInputElement } | null>(null)

  const [textFieldInput, setTextFieldInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])

  const handletextFieldInputChange = useCallback(
    (e, { newValue }) => setTextFieldInput(newValue),
    [setTextFieldInput]
  )

  const handleAddChip = useCallback(
    text => {
      setTextFieldInput('')
      onAddChip(text)
    },
    [setTextFieldInput, onAddChip]
  )
  const handleDeleteChip = useCallback(
    (text, index) => {
      onDeleteChip(index, text)
      autosuggestComponent.current && autosuggestComponent.current.input.focus()
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
    value => {
      const inputValue = value.trim().toLowerCase()

      return inputValue.length === 0
        ? []
        : allTags.filter(tag => tag.toLowerCase().startsWith(inputValue))
    },
    [allTags]
  )
  const onSuggestionsFetchRequested = useCallback(
    ({ value }) => setSuggestions(getSuggestions(value)),
    [setSuggestions, getSuggestions]
  )

  const onSuggestionsClearRequested = () => setSuggestions([])

  const renderSuggestionsContainer = ({
    children,
    containerProps,
  }: {
    children: ReactChild
    containerProps: PaperProps
  }) => (
    <Paper {...containerProps} square className={css.suggestionsContainer}>
      {children}
    </Paper>
  )

  return (
    <Autosuggest
      ref={autosuggestComponent.current}
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
        value => value && value.trim().length > 0,
        []
      )}
      inputProps={{
        chips: tags || [],
        value: textFieldInput,
        onChange: handletextFieldInputChange,
        onAdd: handleAddChip,
        onDelete: handleDeleteChip,
      }}
      renderInputComponent={useCallback(
        ({ value, onChange, chips, ref, ...other }) => (
          <ChipInput
            margin="dense"
            label="Tags"
            placeholder="Type your tag and press 'enter'"
            className={css.tagsField}
            fullWidth
            onAdd={handleAddChip}
            onDelete={handleDeleteChip}
            dataSource={allTags}
            newChipKeyCodes={[13, 9, 32]}
            onUpdateInput={onChange}
            value={chips}
            clearInputValueOnChange
            inputRef={ref}
            {...other}
          />
        ),
        [handleAddChip, handleDeleteChip, allTags]
      )}
    />
  )
}

export default TagsInput
