import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  Dialog,
  DialogActions,
  DialogContent,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from '@material-ui/core'
import * as r from '../redux'
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
  flashcard: { fields, id },
  highlightSelection,
  closeModal,
  file,
}) => (
  <TableRow
    hover
    onClick={() => highlightSelection(id)}
    onDoubleClick={closeModal}
  >
    {/* {file && (
      <TableCell
        style={{
          maxWidth: '8em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {file.name}
      </TableCell>
    )} */}
    {Object.values(fields).map(fieldText => (
      <TableCell>
        <Field text={fieldText} />
      </TableCell>
    ))}
  </TableRow>
)
FlashcardRow = connect((state, { flashcardId }) => ({
  flashcard: getFlashcard(state, flashcardId),
}))(FlashcardRow)

const ShowAll = ({
  closeDialog,
  flashcards,
  currentFileIndex,
  highlightSelection,
  makeClips,
  exportFlashcards,
  noteType,
  open,
}) => (
  <Dialog open={open} onClose={closeDialog}>
    <DialogContent>
      <Table>
        <TableBody>
          {flashcards.map((flashcard, i) => (
            <FlashcardRow
              flashcard={flashcard}
              key={flashcard.id}
              highlightSelection={highlightSelection}
              closeModal={closeDialog}
              flashcardId={flashcard.id}
              // file={file}
              isCurrent={currentFileIndex === i}
            />
          ))}
        </TableBody>
      </Table>
    </DialogContent>
    <DialogActions>
      <Button onClick={exportFlashcards}>Export CSV file</Button>
      <Button onClick={makeClips}>Make audio clips</Button>
    </DialogActions>
  </Dialog>
)

const mapStateToProps = state => ({
  filePaths: r.getFilePaths(state),
  flashcards: r.getFlashcardsByTime(state),
  currentFileIndex: r.getCurrentFileIndex(state),
  currentFileName: r.getCurrentFileName(state),
  currentFilePath: r.getCurrentFilePath(state),
  currentFlashcard: r.getCurrentFlashcard(state),
  currentFlashcardId: r.getCurrentFlashcardId(state),
  isNextButtonEnabled: r.isNextButtonEnabled(state),
  isPrevButtonEnabled: r.isPrevButtonEnabled(state),
  loop: r.isLoopOn(state),
  highlightedWaveformSelectionId: r.getHighlightedWaveformSelectionId(state),
  clipsTimes: r.getClipsTimes(state),
  audioIsLoading: r.isAudioLoading(state),
  mediaFolderLocation: r.getMediaFolderLocation(state),
  currentNoteType: r.getCurrentNoteType(state),
  defaultNoteTypeId: r.getDefaultNoteTypeId(state),
  clipsHaveBeenMade: r.haveClipsBeenMade(state),
})

const mapDispatchToProps = {
  chooseAudioFiles: r.chooseAudioFiles,
  removeAudioFiles: r.removeAudioFiles,
  setCurrentFile: r.setCurrentFile,
  setFlashcardField: r.setFlashcardField,
  toggleLoop: r.toggleLoop,
  deleteCard: r.deleteCard,
  makeClips: r.makeClips,
  exportFlashcards: r.exportFlashcards,
  highlightSelection: r.highlightSelection,
  initializeApp: r.initializeApp,
  detectSilenceRequest: r.detectSilenceRequest,
  deleteAllCurrentFileClipsRequest: r.deleteAllCurrentFileClipsRequest,
  mediaFolderLocationFormDialog: r.mediaFolderLocationFormDialog,
  closeDialog: r.closeDialog,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ShowAll)
