import React from 'react'
import { Button, IconButton, Tooltip } from '@material-ui/core'
import { Close as CloseIcon, Loop } from '@material-ui/icons'
import DarkTheme from './DarkTheme'

const AudioFilesNavMenu = ({
  onClickPrevious,
  onClickNext,
  onClickLoop,
  currentFilename,
  isPrevButtonEnabled,
  isNextButtonEnabled,
  loop,
  chooseAudioFiles,
  removeAudioFiles,
  className,
}) => (
  <DarkTheme>
    <section className={className}>
      {currentFilename ? (
        <h2 className="audioFileName">
          {currentFilename}
          <IconButton onClick={removeAudioFiles}>
            <CloseIcon />
          </IconButton>
        </h2>
      ) : (
        <Button onClick={chooseAudioFiles}>Choose source file</Button>
      )}
      <Tooltip title="Loop audio">
        <IconButton onClick={onClickLoop} color={loop ? 'primary' : 'default'}>
          <Loop />
        </IconButton>
      </Tooltip>{' '}
    </section>
  </DarkTheme>
)

export default AudioFilesNavMenu

// <IconButton onClick={onClickPrevious} disabled={!isPrevButtonEnabled}>
//   <FastRewind />
// </IconButton>
// <IconButton onClick={onClickNext} disabled={!isNextButtonEnabled}>
//   <FastForward />
// </IconButton>
