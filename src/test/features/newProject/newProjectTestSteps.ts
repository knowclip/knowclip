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
  projectId,
  clipIds: [clipId1, clipId2, clipId3],
  mediaFileIds,
  subtitlesTrackIds,
}: {
  projectFileName: string
  projectTitle: string
  projectId: string
  clipIds: [string, string, string]
  mediaFileIds: [string, string]
  subtitlesTrackIds: [string, string]
}) => [
  step('create a new project', (context) =>
    createNewProject(context, projectFileName, 'My cool new poject', projectId)
  ),
  step('change project name', (context) =>
    changeProjectName(context, 'My cool new poject', projectTitle)
  ),
  step('add media to project', (context) =>
    addFirstMediaToProject(
      context,
      'polar_bear_cafe.mp4',
      mediaFileIds[0],
      subtitlesTrackIds[0]
    )
  ),
  step('add a subtitles file', (context) =>
    addSomeSubtitles(context, 'pbc_jp.ass', subtitlesTrackIds[1])
  ),
  step('create clips + flashcards', (context) =>
    makeSomeFlashcards(context, [clipId1, clipId2])
  ),
  step('navigate between clips', (context) => navigateBetweenClips(context)),
  step('move throughout media file', (context) =>
    moveThroughoutMedia(context, clipId3)
  ),
  step('add more media to project', (context) =>
    addMoreMediaToProject(context, mediaFileIds[1])
  ),
  step('navigate between media', (context) => navigateBetweenMedia(context)),
  step('exporting an .apkg', (context) => reviewAndExportApkg(context)),
  step('saving a project file', (context) =>
    saveAndCloseProject(context, projectTitle)
  ),
]
