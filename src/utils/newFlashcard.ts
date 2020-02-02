import {
  SimpleFlashcardFields,
  TransliterationFlashcardFields,
} from '../types/Project'

export const blankSimpleFields: SimpleFlashcardFields = {
  transcription: '',
  meaning: '',
  notes: '',
} as const
export const blankTransliterationFields: TransliterationFlashcardFields = {
  transcription: '',
  pronunciation: '',
  meaning: '',
  notes: '',
} as const

const isTransliterationCard = (
  fields: FlashcardFields
): fields is TransliterationFlashcardFields => 'pronunciation' in fields

const newFlashcard = (
  id: string,
  fields: Flashcard['fields'],
  tags: string[],
  image: Flashcard['image']
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
  tags,
  image,
})

export default newFlashcard
