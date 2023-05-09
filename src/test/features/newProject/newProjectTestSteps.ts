import createNewProject from './createNewProject'
import changeProjectName from './changeProjectName'
import addFirstMediaToProject from './addFirstMediaToProject'
import makeSomeFlashcards from './makeSomeFlashcards'
import navigateBetweenClips from './navigateBetweenClips'
import addMoreMediaToProject from './addMoreMediaToProject'
import navigateBetweenMedia from './navigateBetweenMedia'
import reviewAndExportApkg from './reviewAndExportApkg'
import moveThroughoutMedia from './moveThroughoutMedia'
import saveAndCloseProject from './saveAndCloseProject'
import addSomeSubtitles from './addSomeSubtitles'
import { step } from '../step'

export const newProjectTestSteps = ({
  projectFileName,
  projectTitle,
}: {
  projectFileName: string
  projectTitle: string
}) => [
  step('create a new project', (context) =>
    createNewProject(context, projectFileName, 'My cool new poject')
  ),
  step('change project name', (context) =>
    changeProjectName(context, 'My cool new poject', projectTitle)
  ),
  step('add media to project', (context) =>
    addFirstMediaToProject(context, 'polar_bear_cafe.mp4')
  ),
  step('add a subtitles file', (context) =>
    addSomeSubtitles(context, 'pbc_jp.ass')
  ),
  step('create clips + flashcards', (context) => makeSomeFlashcards(context)),
  step('navigate between clips', (context) => navigateBetweenClips(context)),
  step('move throughout media file', (context) => moveThroughoutMedia(context)),
  step('add more media to project', (context) =>
    addMoreMediaToProject(context)
  ),
  step('navigate between media', (context) => navigateBetweenMedia(context)),
  step('exporting an .apkg', (context) => reviewAndExportApkg(context)),
  step('saving a project file', (context) =>
    saveAndCloseProject(context, projectTitle)
  ),
]
