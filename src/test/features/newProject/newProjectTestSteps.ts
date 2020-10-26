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
  step('create a new project', (setup) =>
    createNewProject(setup, projectFileName, 'My cool new poject')
  ),
  step('change project name', (setup) =>
    changeProjectName(setup, 'My cool new poject', projectTitle)
  ),
  step('add media to project', (setup) =>
    addFirstMediaToProject(setup, 'polar_bear_cafe.mp4')
  ),
  step('add a subtitles file', (setup) =>
    addSomeSubtitles(setup, 'pbc_jp.ass')
  ),
  step('create clips + flashcards', (setup) => makeSomeFlashcards(setup)),
  step('navigate between clips', (setup) => navigateBetweenClips(setup)),
  step('move throughout media file', (setup) => moveThroughoutMedia(setup)),
  step('add more media to project', (setup) => addMoreMediaToProject(setup)),
  step('navigate between media', (setup) => navigateBetweenMedia(setup)),
  step('exporting an .apkg', (setup) => reviewAndExportApkg(setup)),
  step('saving a project file', (setup) =>
    saveAndCloseProject(setup, projectTitle)
  ),
]
