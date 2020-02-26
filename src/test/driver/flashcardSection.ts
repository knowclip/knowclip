import { ClientWrapper } from './ClientWrapper'
import { flashcardSectionForm$ } from '../../components/FlashcardSectionForm'
import { TransliterationFlashcardFields } from '../../types/Project'

export async function fillInTransliterationCardFields(
  client: ClientWrapper,
  newValues: Partial<TransliterationFlashcardFields>
) {
  await client.firstElement_(flashcardSectionForm$.container)
  const { transcription, pronunciation, meaning, notes } = newValues

  if (transcription)
    await client.setFieldValue_(
      flashcardSectionForm$.transcriptionField + ' textarea:not([aria-hidden])',
      transcription
    )
  if (pronunciation)
    await client.setFieldValue_(
      flashcardSectionForm$.pronunciationField + ' textarea:not([aria-hidden])',
      pronunciation
    )
  if (meaning)
    await client.setFieldValue_(
      flashcardSectionForm$.meaningField + ' textarea:not([aria-hidden])',
      meaning
    )
  if (notes)
    await client.setFieldValue_(
      flashcardSectionForm$.notesField + ' textarea:not([aria-hidden])',
      notes
    )
}
