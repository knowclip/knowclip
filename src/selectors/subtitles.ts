import { getFileAvailability } from './files'
import { createSelector } from 'reselect'
import {
  getCurrentMediaFile,
  getCurrentMediaFileMetadata,
} from './currentMedia'
import {
  TransliterationFlashcardFields,
  SubtitlesFlashcardFieldsLinks,
} from '../types/Project'
import { SubtitlesCardBase } from './cardPreview'
import { getBlankFields } from '.'
import { OverlappedCardBaseDuringClipStretch } from '../actions/clips'

export const getSubtitlesDisplayFile = (
  state: AppState,
  id: string
): VttConvertedSubtitlesFile | ExternalSubtitlesFile | null =>
  getSubtitlesDisplayFileFromFilesSubset(
    state.files.ExternalSubtitlesFile,
    state.files.VttConvertedSubtitlesFile,
    id
  )

const getSubtitlesDisplayFileFromFilesSubset = (
  external: FilesState['ExternalSubtitlesFile'],
  generated: FilesState['VttConvertedSubtitlesFile'],
  id: string
): ExternalSubtitlesFile | VttConvertedSubtitlesFile | null =>
  generated[id] || external[id] || null

export const getSubtitlesSourceFile = (
  state: AppState,
  id: string
): ExternalSubtitlesFile | VttConvertedSubtitlesFile | null =>
  getSubtitlesSourceFileFromFilesSubset(
    state.files.ExternalSubtitlesFile,
    state.files.VttConvertedSubtitlesFile,
    id
  )
const getSubtitlesSourceFileFromFilesSubset = (
  external: FilesState['ExternalSubtitlesFile'],
  generated: FilesState['VttConvertedSubtitlesFile'],
  id: string
): ExternalSubtitlesFile | VttConvertedSubtitlesFile | null =>
  external[id] || generated[id] || null

export const getSubtitlesFileAvailability = (state: AppState, id: string) => {
  const record = getSubtitlesDisplayFile(state, id)

  return record ? getFileAvailability(state, record) : null
}

const getSubtitles = (state: AppState) => state.subtitles

const getCurrentMediaFileSubtitles = (state: AppState) => {
  const currentMediaFile = getCurrentMediaFile(state)
  return currentMediaFile ? currentMediaFile.subtitles : []
}
export const getSubtitlesTracks = createSelector(
  getCurrentMediaFileSubtitles,
  getSubtitles,
  (currentFileSubtitles, subtitles): Array<SubtitlesTrack> => {
    if (!currentFileSubtitles.length) return []
    return currentFileSubtitles
      .map(({ id }) => subtitles[id])
      .filter((track): track is SubtitlesTrack => Boolean(track))
  }
)

export type SubtitlesFileWithTrack =
  | EmbeddedSubtitlesFileWithTrack
  | ExternalSubtitlesFileWithTrack
export type EmbeddedSubtitlesFileWithTrack = {
  id: SubtitlesTrackId
  relation: EmbeddedSubtitlesTrackRelation
  label: string
  embeddedIndex: number
  sourceFile: VttConvertedSubtitlesFile | null // can be null while loading?
  displayFile: VttConvertedSubtitlesFile | null
  track: EmbeddedSubtitlesTrack | null
}
export type ExternalSubtitlesFileWithTrack = {
  id: SubtitlesTrackId
  relation: ExternalSubtitlesTrackRelation
  label: string
  externalIndex: number
  sourceFile: ExternalSubtitlesFile | null // should never really be null
  displayFile: ExternalSubtitlesFile | null
  track: ExternalSubtitlesTrack | null
}

export type MediaSubtitles = {
  total: number
  embedded: EmbeddedSubtitlesFileWithTrack[]
  external: ExternalSubtitlesFileWithTrack[]
  all: SubtitlesFileWithTrack[]
}

export const getSubtitlesFilesWithTracks = createSelector(
  getCurrentMediaFile,
  getCurrentMediaFileMetadata,
  getSubtitles,
  (state: AppState) => state.files.ExternalSubtitlesFile,
  (state: AppState) => state.files.VttConvertedSubtitlesFile,
  (
    currentFile,
    currentFileMetadata,
    subtitlesTracks,
    externalFiles,
    convertedFiles
  ): MediaSubtitles => {
    let embeddedCount = 0
    let externalCount = 0

    const subtitles = currentFile
      ? /* eslint-disable array-callback-return */
        currentFile.subtitles.map((t) => {
          switch (t.type) {
            case 'EmbeddedSubtitlesTrack': {
              const streamIndex =
                currentFile.subtitlesTracksStreamIndexes[embeddedCount]
              const tags = currentFileMetadata?.streams[streamIndex]?.tags
              const languageTag =
                tags && typeof tags === 'object' && 'language' in tags
                  ? tags.language
                  : null
              const embeddedIndex = ++embeddedCount
              return {
                id: t.id,
                relation: t,
                embeddedIndex,
                label: `Embedded subtitles track ${embeddedIndex} ${
                  languageTag ? `(${languageTag.toUpperCase()})` : ''
                }`,
                sourceFile: getSubtitlesSourceFileFromFilesSubset(
                  externalFiles,
                  convertedFiles,
                  t.id
                ),
                displayFile: getSubtitlesDisplayFileFromFilesSubset(
                  externalFiles,
                  convertedFiles,
                  t.id
                ),
                track: subtitlesTracks[t.id] || null,
              } as EmbeddedSubtitlesFileWithTrack
            }
            case 'ExternalSubtitlesTrack': {
              const externalIndex = ++externalCount
              const sourceFile = getSubtitlesSourceFileFromFilesSubset(
                externalFiles,
                convertedFiles,
                t.id
              )
              return {
                id: t.id,
                relation: t,
                externalIndex,
                label:
                  sourceFile && 'name' in sourceFile
                    ? sourceFile.name
                    : `External subtitles track ${externalIndex}`,
                sourceFile,
                displayFile: getSubtitlesDisplayFileFromFilesSubset(
                  externalFiles,
                  convertedFiles,
                  t.id
                ),
                track: subtitlesTracks[t.id] || null,
              } as ExternalSubtitlesFileWithTrack
            }
          }
          /* eslint-enable array-callback-return */
        })
      : []

    return {
      total: subtitles.length,
      all: subtitles,
      embedded: subtitles.filter(
        (s): s is EmbeddedSubtitlesFileWithTrack =>
          s.relation.type === 'EmbeddedSubtitlesTrack'
      ),
      external: subtitles.filter(
        (s): s is ExternalSubtitlesFileWithTrack =>
          s.relation.type === 'ExternalSubtitlesTrack'
      ),
    }
  }
)

export const getSubtitlesTrack = (
  state: AppState,
  id: SubtitlesTrackId
): SubtitlesTrack | null => state.subtitles[id] || null

export const readVttChunk = ({
  start,
  end,
  text,
  index,
}: {
  start: number
  end: number
  text: string
  index: number
}): SubtitlesChunk => ({
  start: start,
  end: end,
  text,
  index,
})

export const readSubsrtChunk = readVttChunk

const HALF_SECOND = 500

export const overlapsSignificantly = (
  chunk: { start: number; end: number },
  start: number,
  end: number
): boolean =>
  start <= chunk.end - HALF_SECOND && end >= chunk.start + HALF_SECOND

const EMPTY_OBJECT = Object.freeze({})
export const getSubtitlesFlashcardFieldLinks = (
  state: AppState // should probably be ?id
): SubtitlesFlashcardFieldsLinks => {
  const media = getCurrentMediaFile(state)
  return media ? media.flashcardFieldsToSubtitlesTracks : EMPTY_OBJECT
}

export const getNewFlashcardForStretchedClip_ = (
  links: SubtitlesFlashcardFieldsLinks,
  subtitles: SubtitlesState,
  clip: Clip,
  flashcards: FlashcardsState,
  newlyOverlapped: {
    front: Array<SubtitlesCardBase>
    back: Array<SubtitlesCardBase>
  }
): Flashcard => {
  const flashcard = flashcards[clip.id]
  const linkedFieldNames = Object.keys(
    links
  ) as TransliterationFlashcardFieldName[]
  if (!linkedFieldNames.length) return flashcard

  const originalFields: TransliterationFlashcardFields = flashcard.fields as any
  const newFields = {} as TransliterationFlashcardFields
  const newCloze: ClozeDeletion[] = []

  for (const fieldName of linkedFieldNames) {
    const trackId = links[fieldName]
    const combined = [
      ...newlyOverlapped.front,
      clip,
      ...newlyOverlapped.back,
    ].reduce(
      (acc, overlappedItem) => {
        const startIndex = acc.text.length
        const trimmedTextSoFar = acc.text.trim()
        if (overlappedItem.clipwaveType === 'Secondary') {
          const newTextSegments = getFlashcardTextFromCardBase(
            overlappedItem,
            trackId != null ? subtitles[trackId] : trackId
          )
          const newText = newTextSegments.filter((t) => t.trim()).join('\n')

          const padding = trimmedTextSoFar || newText ? '\n' : ''
          acc.text += padding + newText
        } else {
          const flashcard = flashcards[overlappedItem.id]
          const newText = (
            (flashcard?.fields as TransliterationFlashcardFields | undefined)?.[
              fieldName
            ] || ''
          ).trim()

          const padding = trimmedTextSoFar || newText ? '\n' : ''

          acc.text += padding + newText

          const cloze = flashcard?.cloze || []
          acc.cloze.push(
            ...cloze.map((c) => ({
              ...c,
              ranges: c.ranges.map(({ start, end }) => ({
                start: start + startIndex,
                end: end + startIndex,
              })),
            }))
          )
        }

        return acc
      },
      { text: '', cloze: [] as ClozeDeletion[] }
    )

    newFields[fieldName] = (newFields[fieldName] || '') + combined.text
    newCloze.push(...combined.cloze)
  }

  if (
    Object.keys(newFields).every(
      (k) =>
        originalFields[k as TransliterationFlashcardFieldName] ===
        newFields[k as TransliterationFlashcardFieldName]
    )
  )
    return flashcard

  return { ...flashcard, fields: newFields }
}

function getFlashcardFieldsFromSubtitlesCardBase(
  linkedTracks: SubtitlesFlashcardFieldsLinks,
  overlappedItem: SubtitlesCardBase,
  subtitles: SubtitlesState,
  shouldUseField: (fn: TransliterationFlashcardFieldName) => boolean = () =>
    true
) {
  const newFields = {} as TransliterationFlashcardFields
  for (const fn in linkedTracks) {
    const fieldName = fn as TransliterationFlashcardFieldName
    if (shouldUseField(fieldName)) {
      const trackId = linkedTracks[fieldName]
      const track = trackId ? subtitles[trackId] : null
      const newTextSegments = getFlashcardTextFromCardBase(
        overlappedItem,
        track
      )
      const newText = newTextSegments.filter((t) => t.trim()).join('\n')
      newFields[fieldName] = newText
    }
  }

  return newFields
}

export const getNewFlashcardForStretchedClip = (
  state: AppState,
  unstretchedClip: { id: ClipId; start: number; end: number },
  stretchedClip: { id: ClipId; start: number; end: number },
  overlappedSubtitlesCardBases: {
    front: OverlappedCardBaseDuringClipStretch[]
    back: OverlappedCardBaseDuringClipStretch[]
  }
): Pick<Flashcard, 'cloze' | 'fields'> => {
  const {
    subtitles,
    clips: { flashcards },
  } = state
  const links = getSubtitlesFlashcardFieldLinks(state)

  const fieldNames = Object.keys(
    flashcards[stretchedClip.id].fields
  ) as TransliterationFlashcardFieldName[]
  const currentlyBlankFieldNames = new Set(
    fieldNames.filter(
      (fn) =>
        links[fn] &&
        !(
          (
            flashcards[stretchedClip.id]
              .fields as TransliterationFlashcardFields
          )[fn] || ''
        ).trim()
    )
  )

  function newlyOverlapped(overlappedCardBase: SubtitlesCardBase) {
    return !overlapsSignificantly(
      overlappedCardBase,
      unstretchedClip.start,
      unstretchedClip.end
    )
  }
  const { front, back } = {
    front: overlappedSubtitlesCardBases.front.map(
      ({ subtitlesCardBase: base, isSelectable }) => ({
        // if a given field is blank, use the combined text from ALL overlaps
        // otherwise, only used the combined text of NEW overlaps
        fields: getFlashcardFieldsFromSubtitlesCardBase(
          links,
          base,
          subtitles,
          (fn) =>
            isSelectable
              ? newlyOverlapped(base)
              : currentlyBlankFieldNames.has(fn)
        ),

        cloze: [],
      })
    ),
    back: overlappedSubtitlesCardBases.back.map(
      ({ subtitlesCardBase: base, isSelectable }) => ({
        fields: getFlashcardFieldsFromSubtitlesCardBase(
          links,
          base,
          subtitles,
          (fn) =>
            isSelectable
              ? newlyOverlapped(base)
              : currentlyBlankFieldNames.has(fn)
        ),
        cloze: [],
      })
    ),
  }
  const all = [...front, flashcards[stretchedClip.id], ...back]
  const combined = combineFlashcards(
    { ...getBlankFields(state) } as TransliterationFlashcardFields,
    all
  )

  return {
    ...flashcards[stretchedClip.id],
    ...combined,
  }
}

function combineFlashcards(
  newFields: TransliterationFlashcardFields,
  cards: Pick<Flashcard, 'cloze' | 'fields'>[]
): Pick<Flashcard, 'cloze' | 'fields'> {
  const newCloze: ClozeDeletion[] = []

  for (const fn in newFields) {
    const fieldName = fn as TransliterationFlashcardFieldName
    const acc = { text: '', cloze: [] as ClozeDeletion[] }
    for (const card of cards as TransliterationFlashcard[]) {
      const startIndex = acc.text.length
      const trimmedTextSoFar = acc.text.trim()

      const newText = (card.fields[fieldName] || '').trim()
      const padding = trimmedTextSoFar && newText ? '\n' : ''
      acc.text += padding + newText

      if (fieldName === 'transcription') {
        const cloze = card?.cloze || []
        acc.cloze.push(
          ...cloze.map((c) => ({
            ...c,
            ranges: c.ranges.map(({ start, end }) => ({
              start: start + startIndex + padding.length,
              end: end + startIndex + padding.length,
            })),
          }))
        )
      }
    }

    newFields[fieldName] = (newFields[fieldName] || '') + acc.text
    newCloze.push(...acc.cloze)
  }

  return {
    fields: newFields,
    cloze: newCloze,
  }
}

export function getFlashcardTextFromCardBase(
  cardBase: SubtitlesCardBase,
  track?: SubtitlesTrack | null
) {
  if (!track || !track.chunks.length) return []

  const chunkIndexes = cardBase.fields[track.id]
  if (!chunkIndexes) return []
  return chunkIndexes.flatMap((chunkIndex) => track.chunks[chunkIndex].text)
}
