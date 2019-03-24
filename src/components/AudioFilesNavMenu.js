import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Button, IconButton, Tooltip } from '@material-ui/core'
import { Close as CloseIcon, Loop } from '@material-ui/icons'
import DarkTheme from './DarkTheme'
import truncate from '../utils/truncate'
import * as r from '../redux'

class AudioFilesNavMenu extends Component {
  render() {
    const {
      className,
      toggleLoop,
      currentFileName,
      chooseAudioFiles,
      loop,
    } = this.props

    return (
      <DarkTheme>
        <section className={className}>
          {currentFileName ? (
            <span className="audioFileName" title={currentFileName}>
              <Button onClick={chooseAudioFiles}>
                {truncate(currentFileName, 30)}
              </Button>
              {/* <IconButton onClick={removeAudioFiles}>
                <CloseIcon />
              </IconButton> */}
            </span>
          ) : (
            <Button onClick={chooseAudioFiles}>Choose source file</Button>
          )}
          <Tooltip title="Loop audio">
            <IconButton
              onClick={toggleLoop}
              color={loop ? 'primary' : 'default'}
            >
              <Loop />
            </IconButton>
          </Tooltip>{' '}
        </section>
      </DarkTheme>
    )
  }
}

const mapStateToProps = state => ({
  loop: r.isLoopOn(state),
  currentFileName: r.getCurrentFileName(state),
})

const mapDispatchToProps = {
  toggleLoop: r.toggleLoop,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AudioFilesNavMenu)

// <IconButton onClick={onClickPrevious} disabled={!isPrevButtonEnabled}>
//   <FastRewind />
// </IconButton>
// <IconButton onClick={onClickNext} disabled={!isNextButtonEnabled}>
//   <FastForward />
// </IconButton>
