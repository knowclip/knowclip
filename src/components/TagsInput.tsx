import { Autocomplete, AutocompleteProps, Chip, TextField } from '@mui/material'
import { useState } from 'react'
import classnames from 'classnames'

import { tagsInput$ as $ } from './TagsInput.testLabels'

export default function ChipsInput<
  DisableClearable extends boolean | undefined = false
>({
  onAddChip,
  onDeleteChip,
  tags,
  ...props
}: Partial<AutocompleteProps<string, true, DisableClearable, true>> &
  Pick<AutocompleteProps<string, true, DisableClearable, true>, 'options'> & {
    onAddChip: (text: string) => void
    onDeleteChip: (index: number) => void
    tags: string[]
  }) {
  const [inputValue, setInputValueRaw] = useState('')
  const setInputValue = (text: string) =>
    setInputValueRaw(sanitizeChipText(text))
  return (
    <Autocomplete
      clearIcon={false}
      freeSolo={props.freeSolo ?? true}
      multiple={props.multiple ?? true}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
      className={classnames(props.className, $.container)}
      filterOptions={(o) => o.filter((x) => !tags.includes(x))}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => {
          const props = getTagProps({ index })
          return (
            <Chip
              label={option}
              {...props}
              key={props.key}
              className={classnames(props.className, $.tagChip)}
            />
          )
        })
      }
      renderInput={(params) => (
        <TextField
          margin="dense"
          label="Add Tags"
          placeholder="Type your tag and press 'enter'"
          onBlur={(e) => {
            const value = e.target.value.trim()
            if (!value) return

            setInputValue('')
            onAddChip(value)
          }}
          {...params}
          inputProps={{
            ...params.inputProps,
            className: classnames($.inputField, params.inputProps.className),
          }}
        />
      )}
      clearOnEscape
      onChange={(e, value, reason, details): void => {
        if (reason === 'clear') {
          return setInputValue('')
        }

        if (!details) return console.error('details is undefined')

        const { option } = details
        if (reason === 'createOption' || reason === 'selectOption') {
          return onAddChip(details.option)
        }
        if (reason === 'removeOption') {
          if (!tags.includes(option)) return setInputValue('')

          const optionIndex = tags.indexOf(details.option)
          return onDeleteChip(optionIndex)
        }
      }}
      value={tags}
      {...props}
    />
  )
}

function sanitizeChipText(text: string) {
  return text.replace(/\s/g, '_')
}
