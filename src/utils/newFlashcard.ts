export const blankSimpleFields: SimpleFlashcardFields = {
  transcription: '',
  meaning: '',
  notes: '',
} as const
export const blankTransliterationFields: TransliterationFlashcardFields = {
  transcription: '',
  meaning: '',
  notes: '',
  pronunciation: '',
} as const

const isTransliterationCard = (
  fields: FlashcardFields
): fields is TransliterationFlashcardFields => 'pronunciation' in fields

const newFlashcard = (
  id: string,
  fields: Flashcard['fields'],
  tags: string[],
  includeStill: boolean
): Flashcard => ({
  id,
  type: isTransliterationCard(fields) ? 'Transliteration' : 'Simple',
  fields:
    'pronunciation' in fields
      ? {
          ...blankSimpleFields,
          ...fields,
        }
      : {
          ...blankTransliterationFields,
          ...fields,
        },
  tags: tags,
  image: includeStill
    ? {
        id,
        type: 'VideoStillImage',
      }
    : null,
})

export default newFlashcard
