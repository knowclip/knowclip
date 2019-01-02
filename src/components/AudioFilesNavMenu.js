import React, { Fragment } from 'react'
import { Button, IconButton } from '@material-ui/core'
import { Close as CloseIcon } from '@material-ui/icons'

const AudioFilesNavMenu = ({
  onClickPrevious,
  onClickNext,
  currentFilename,
  isPrevButtonEnabled,
  isNextButtonEnabled,
  chooseAudioFiles,
  removeAudioFiles,
}) => (
  <Fragment>
    <p className="audioFilesMenu">
      <Button onClick={onClickPrevious} disabled={!isPrevButtonEnabled}>
        Previous
      </Button>
      {currentFilename ? (
        <h2 className="audioFileName">
          {currentFilename}
          <IconButton onClick={removeAudioFiles}>
            <CloseIcon />
          </IconButton>
        </h2>
      ) : (
        <Button onClick={chooseAudioFiles}>Choose audio files </Button>
      )}
      <Button onClick={onClickNext} disabled={!isNextButtonEnabled}>
        Next
      </Button>
    </p>
  </Fragment>
)

export default AudioFilesNavMenu
