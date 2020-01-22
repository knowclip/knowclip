import { ElementWrapper } from './ElementWrapper'

export async function fillInFlashcardFields(
  transliterationFieldsElements: ElementWrapper[],
  {
    transcription,
    pronunciation,
    meaning,
    notes,
  }: Partial<TransliterationFlashcardFields>
) {
  const [
    transcriptionEl,
    pronunciationEl,
    meaningEl,
    notesEl,
  ] = transliterationFieldsElements
  if (transcription) await transcriptionEl.setFieldValue(transcription)
  if (pronunciation) await pronunciationEl.setFieldValue(pronunciation)
  if (meaning) await meaningEl.setFieldValue(meaning)
  if (notes) await notesEl.setFieldValue(notes)
}
