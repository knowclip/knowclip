import React, { useRef, useState } from 'react'

import { MenuItem, Paper } from '@material-ui/core'
import ChipInput from 'material-ui-chip-input'
import css from './FlashcardSection.module.css'
import Autosuggest from 'react-autosuggest'

const TagsInput = ({ allTags, tags, onAddChip, onDeleteChip }) => {
  const autosuggestComponent = useRef(null)

  const [textFieldInput, setTextFieldInput] = useState('')
  const [suggestions, setSuggestions] = useState([])

  const handletextFieldInputChange = (e, { newValue }) =>
    setTextFieldInput(newValue)

  const handleAddChip = text => {
    setTextFieldInput('')
    onAddChip(text)
  }
  const handleDeleteChip = (text, index) => {
    onDeleteChip(index, text)
    autosuggestComponent.current && autosuggestComponent.current.input.focus()
  }

  const onSuggestionHighlighted = ({ suggestion }) => {
    const el =
      suggestion && document.querySelector(`#tag__${suggestion}:not(:hover)`)
    if (el) {
      el.scrollIntoView(false)
    }
  }

  const onSuggestionSelected = (e, { suggestionValue }) => {
    handleAddChip(suggestionValue)
    e.preventDefault()
  }

  const getSuggestions = value => {
    const inputValue = value.trim().toLowerCase()

    return inputValue.length === 0
      ? []
      : allTags.filter(tag => tag.toLowerCase().startsWith(inputValue))
  }
  const onSuggestionsFetchRequested = ({ value }) =>
    setSuggestions(getSuggestions(value))

  const onSuggestionsClearRequested = () => setSuggestions([])

  const renderSuggestionsContainer = ({ children, containerProps }) => (
    <Paper {...containerProps} square className={css.suggestionsContainer}>
      {children}
    </Paper>
  )
  const getSuggestionValue = a => a
  const renderSuggestion = (suggestion, { query, isHighlighted, ...other }) => {
    // const matches = match(suggestion.name, query)
    // const parts = parse(suggestion.name, matches)
    const preventDefault = e => e.preventDefault() // prevent the click causing the input to be blurred
    return (
      <MenuItem
        selected={isHighlighted}
        onMouseDown={preventDefault}
        id={`tag__${suggestion}`}
        {...other}
      >
        {/* {parts.map((part, index) => {
            return part.highlight ? (
              <span key={String(index)} style={{ fontWeight: 500 }}>
                {part.text}
              </span>
            ) : (
              <span key={String(index)}>{part.text}</span>
            )
          })} */}
        {suggestion}
      </MenuItem>
    )
  }
  const renderChipsInput = ({ value, onChange, chips, ref, ...other }) => (
    <ChipInput
      margin="dense"
      label="Tags"
      placeholder="Type your tag and press 'enter'"
      className={css.tagsField}
      fullWidth
      onAdd={chip => handleAddChip(chip)}
      onDelete={(chip, index) => handleDeleteChip(chip, index)}
      dataSource={allTags}
      newChipKeyCodes={[13, 9, 32]}
      onUpdateInput={onChange}
      value={chips}
      clearInputValueOnChange
      inputRef={ref}
      {...other}
    />
  )
  return (
    <Autosuggest
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
      shouldRenderSuggestions={value => value && value.trim().length > 0}
      inputProps={{
        chips: tags || [],
        value: textFieldInput,
        onChange: handletextFieldInputChange,
        onAdd: handleAddChip,
        onDelete: handleDeleteChip,
      }}
      renderInputComponent={renderChipsInput}
      ref={autosuggestComponent.current}
    />
  )
}

export default TagsInput
