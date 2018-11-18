import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  Dialog,
  DialogActions,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from '@material-ui/core'

import { getFlashcard } from '../selectors'

const getFieldStyles = string => {
  const styles = {}
  if (!string.trim().length) styles.color = 'red'
  return styles
}

const Field = ({ text }) => (
  <span style={getFieldStyles(text)}>{text || 'blank'}</span>
)

let FlashcardRow = ({
  flashcard: { de, en, id },
  highlightSelection,
  closeModal,
  file,
}) => (
  <TableRow
    hover
    onClick={() => highlightSelection(id)}
    onDoubleClick={closeModal}
  >
    {file && (
      <TableCell
        style={{
          maxWidth: '8em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {file.name}
      </TableCell>
    )}
    <TableCell>
      <Field text={de} />
    </TableCell>
    <TableCell>
      <Field text={en} />
    </TableCell>
  </TableRow>
)
FlashcardRow = connect((state, { flashcardId }) => ({
  flashcard: getFlashcard(state, flashcardId),
}))(FlashcardRow)

const ShowAll = ({
  open,
  handleClose,
  flashcards,
  currentFileIndex,
  highlightSelection,
  makeClips,
  exportFlashcards,
}) => (
  <Dialog open={open} onClose={handleClose} style={{ width: '900px' }}>
    <Table>
      <TableBody>
        {flashcards.map((flashcard, i) => (
          <FlashcardRow
            key={flashcard.id}
            highlightSelection={highlightSelection}
            closeModal={handleClose}
            flashcardId={flashcard.id}
            // file={file}
            isCurrent={currentFileIndex === i}
          />
        ))}
      </TableBody>
    </Table>
    <DialogActions>
      <Button onClick={exportFlashcards}>Export CSV file</Button>
      <Button onClick={makeClips}>Make audio clips</Button>
    </DialogActions>
  </Dialog>
)

export default ShowAll
