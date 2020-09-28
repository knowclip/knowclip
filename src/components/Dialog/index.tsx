import React from 'react'
import { useSelector } from 'react-redux'
import Confirmation from './Confirmation'
import MediaFolderLocationForm from './MediaFolderLocationFormDialog'
import ReviewAndExport from '../ReviewAndExport'
import NewProjectForm from './NewProjectFormDialog'
import CsvAndMp3Export from './CsvAndMp3ExportDialog'
import SubtitlesClips from './SubtitlesClipsDialog'
import FileSelection from './FileSelectionDialog'
import ErrorDialog from './ErrorDialog'
import SettingsDialog from './SettingsDialog'
import { getCurrentDialog } from '../../selectors'
import LinkSubtitlesDialog from './LinkSubtitlesDialog'
import Dictionaries from './DictionariesDialog'

const DialogView = () => {
  const currentDialog = useSelector((state: AppState) =>
    getCurrentDialog(state)
  )

  if (!currentDialog) return null

  switch (currentDialog.type) {
    case 'Confirmation':
      return <Confirmation open={true} data={currentDialog} />
    case 'MediaFolderLocationForm':
      return <MediaFolderLocationForm open={true} data={currentDialog} />
    case 'ReviewAndExport':
      return <ReviewAndExport open={true} data={currentDialog} />
    case 'NewProjectForm':
      return <NewProjectForm open={true} data={currentDialog} />
    case 'CsvAndMp3Export':
      return <CsvAndMp3Export open={true} data={currentDialog} />
    case 'SubtitlesClips':
      return <SubtitlesClips open={true} data={currentDialog} />
    case 'FileSelection':
      return (
        <FileSelection
          open={true}
          data={currentDialog}
          key={currentDialog.file.id}
        />
      )
    case 'Error':
      return <ErrorDialog open={true} data={currentDialog} />
    case 'Settings':
      return <SettingsDialog open={true} data={currentDialog} />
    case 'LinkSubtitles':
      return (
        <LinkSubtitlesDialog
          open={true}
          data={currentDialog}
          key={currentDialog.subtitles.id}
        />
      )
    case 'Dictionaries':
      return <Dictionaries open={true} data={{ type: 'Dictionaries' }} />
  }
}

export default DialogView
