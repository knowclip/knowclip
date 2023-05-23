import openSavedProject from './openSavedProject'
import makeSomeFlashcards from './makeSomeFlashcards'
import saveAndCloseProject from './saveAndCloseProject'
import linkSubtitlesToFields from './linkSubtitlesToFields'
import { step } from '../step'

export const savedProjectTestSteps = ({
  projectTitle,
  existingClipId,
  newClipIds,
}: {
  projectTitle: string
  existingClipId: string
  newClipIds: [string, string, string]
}) => [
  step('opens a previously saved project', (context) =>
    openSavedProject(context)
  ),
  step('make some flashcards', (context) =>
    makeSomeFlashcards(context, newClipIds)
  ),
  step('link subtitles to fields', (context) =>
    linkSubtitlesToFields(context, { firstClipId: existingClipId })
  ),
  step('save and closes project', (context) =>
    saveAndCloseProject(context, projectTitle)
  ),
]
