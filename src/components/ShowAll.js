import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Dialog, DialogActions, Table, TableBody, TableRow, TableCell, Button } from '@material-ui/core'

import { getFlashcard } from '../selectors'
import exportCsv from '../utils/exportCsv'

const getFieldStyles = (string) => {
  const styles = { }
  if (!string.trim().length) styles.color = 'red'
  return styles
}

const Field = ({ text }) => <span style={getFieldStyles(text)}>
  {text || 'blank'}
</span>

let FlashcardRow = ({ flashcard: { de, en }, index, goToFile, closeModal, file }) =>
  <TableRow hover onClick={() => goToFile(index)} onDoubleClick={closeModal}>
    {file &&
      <TableCell style={{ maxWidth: '8em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</TableCell>
    }
    <TableCell><Field text={de} /></TableCell>
    <TableCell><Field text={en} /></TableCell>
  </TableRow>
FlashcardRow = connect((state, { flashcardId }) => ({
  flashcard: getFlashcard(state, flashcardId)
}))(FlashcardRow)


export default class ShowAll extends Component {
  exportCsv = () => {
    const { flashcards } = this.props
    // exportCsv(files, flashcards)
  }

  render() {
    const { open, handleClose, flashcards, currentFileIndex, goToFile } = this.props
    return <Dialog open={open} onClose={handleClose} style={{ width: '900px' }}>
      <Table>
        <TableBody>
          {flashcards.map((flashcard, i) =>
            <FlashcardRow
              key={flashcard.id}
              goToFile={goToFile}
              closeModal={handleClose}
              flashcardId={flashcard.id}
              // file={file}
              isCurrent={currentFileIndex === i}
              index={i}
            />
          )}
        </TableBody>
      </Table>
      <DialogActions>
        <Button onClick={this.exportCsv}>Export CSV file</Button>
      </DialogActions>
    </Dialog>
  }
}
