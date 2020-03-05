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
  image: Flashcard['image'],
  cloze: ClozeDeletion[] = []
): Flashcard => {
  return isTransliterationCard(fields)
    ? {
        id,
        type: 'Transliteration',
        fields: {
          ...blankTransliterationFields,
          ...fields,
        },
        tags,
        image,
        cloze,
      }
    : {
        id,
        type: 'Simple',
        fields: {
          ...blankSimpleFields,
          ...fields,
        },
        tags,
        image,
        cloze,
      }
}

export default newFlashcard
