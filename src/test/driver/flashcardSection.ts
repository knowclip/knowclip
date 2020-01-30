import { ClientWrapper } from './ClientWrapper'
import { flashcardSectionForm$ } from '../../components/FlashcardSectionForm'

export async function fillInTransliterationCardFields(
  client: ClientWrapper,
  newValues: Partial<TransliterationFlashcardFields>
) {
  const [
    transcriptionEl,
    pronunciationEl,
    meaningEl,
    notesEl,
  ] = await client.elements_(
    `${flashcardSectionForm$.flashcardFields} textarea:not([aria-hidden])`,
    4
  )
  const { transcription, pronunciation, meaning, notes } = newValues

  if (transcription) await transcriptionEl.setFieldValue(transcription)
  if (pronunciation) await pronunciationEl.setFieldValue(pronunciation)
  if (meaning) await meaningEl.setFieldValue(meaning)
  if (notes) await notesEl.setFieldValue(notes)
}
