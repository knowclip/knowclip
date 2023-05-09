import openSavedProject from './openSavedProject'
import makeSomeFlashcards from './makeSomeFlashcards'
import saveAndCloseProject from './saveAndCloseProject'
import linkSubtitlesToFields from './linkSubtitlesToFields'
import { step } from '../step'

export const savedProjectTestSteps = ({
  projectTitle,
}: {
  projectTitle: string
}) => [
  step('opens a previously saved project', (context) =>
    openSavedProject(context)
  ),
  step('make some flashcards', (context) => makeSomeFlashcards(context)),
  step('link subtitles to fields', (context) => linkSubtitlesToFields(context)),
  step('save and closes project', (context) =>
    saveAndCloseProject(context, projectTitle)
  ),
]
