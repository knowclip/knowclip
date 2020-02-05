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
  step('opens a previously saved project', setup => openSavedProject(setup)),
  step('make some flashcards', setup => makeSomeFlashcards(setup)),
  step('link subtitles to fields', setup => linkSubtitlesToFields(setup)),
  step('save and closes project', setup =>
    saveAndCloseProject(setup, projectTitle)
  ),
]
