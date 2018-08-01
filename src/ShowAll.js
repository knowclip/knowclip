import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Dialog, DialogActions, Table, TableBody, TableRow, TableCell, Button } from '@material-ui/core'
import { unparse } from 'papaparse'
import { getFlashcard } from './selectors'

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
    <TableCell style={{ maxWidth: '8em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</TableCell>
    <TableCell><Field text={de} /></TableCell>
    <TableCell><Field text={en} /></TableCell>
  </TableRow>
FlashcardRow = connect((state, { flashcardId }) => ({
  flashcard: getFlashcard(state, flashcardId)
}))(FlashcardRow)


export default class ShowAll extends Component {
  exportCsv = () => {
    const { files, flashcards } = this.props
    const usableFlashcards = files
      .map(file => flashcards[file.name])
      .filter(({ de, en }) => de.trim() || en.trim())
      .map(({ en, de }, i) => [de, en, `[sound:${files[i].name}]`])
    // TODO: alert if no usable
    let csv = unparse(usableFlashcards)
    const filename = 'export.csv';
    console.log(csv)
    if (!csv.match(/^data:text\/csv/i)) {
        csv = 'data:text/csv;charset=utf-8,' + csv;
    }
    const data = encodeURI(csv);

    const link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', filename);
    link.click();
  }

  render() {
    const { open, handleClose, files, currentFileIndex, goToFile } = this.props
    return <Dialog open={open} onClose={handleClose} style={{ width: '900px' }}>
      <Table>
        <TableBody>
          {files.map((file, i) =>
            <FlashcardRow
              key={file.name}
              goToFile={goToFile}
              closeModal={handleClose}
              flashcardId={file.name}
              file={file}
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
