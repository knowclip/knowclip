import { createSelector } from 'reselect'
import {
  getSubtitlesFlashcardFieldLinks,
  overlapsSignificantly,
} from './subtitles'
import { getCurrentMediaFile } from './currentMedia'
import { calculateRegions, PrimaryClip, WaveformRegion } from 'clipwave'
import { getRegionEnd } from '../utils/clipwave/useWaveformEventHandlers'

type SubtitlesCardBaseId = string

export type SubtitlesCardBase = {
  fields: Dict<SubtitlesTrackId, SubtitlesChunkIndex[]>
  clipwaveType: 'Secondary'
  id: SubtitlesCardBaseId
  index: number
  start: number
  end: number
}
type SubtitlesChunkIndex = number

export const CUES_BASE_PRIORITY: TransliterationFlashcardFieldName[] = [
  'transcription',
  'pronunciation',
  'meaning',
  'notes',
]

const getSubtitlesCardBaseFieldPriority = createSelector(
  getSubtitlesFlashcardFieldLinks,
  (state: AppState) => state.subtitles,
  (links, subtitles) => {
    return CUES_BASE_PRIORITY.filter((fieldName) => {
      const trackId = links[fieldName]
      return Boolean(trackId && subtitles[trackId])
    })
  }
)

export type SubtitlesCardBases = {
  totalTracksCount: number
  cards: SubtitlesCardBase[]
  cardsMap: Record<string, SubtitlesCardBase>
  fieldNames: TransliterationFlashcardFieldName[]
  linkedTrackIds: SubtitlesTrackId[]
  excludedTracks: SubtitlesTrack[]
  getFieldsPreviewFromCardsBase: (
    cardBase: SubtitlesCardBase
  ) => Dict<SubtitlesTrackId, string>
}

export const getSubtitlesCardBases = createSelector(
  (state: AppState) => state.subtitles,
  getCurrentMediaFile,
  getSubtitlesFlashcardFieldLinks,
  getSubtitlesCardBaseFieldPriority,
  (
    subtitles,
    currentFile,
    fieldsToTracks,
    fieldsCuePriority
  ): SubtitlesCardBases => {
    const [cueField] = fieldsCuePriority
    const cueTrackId = cueField && fieldsToTracks[cueField]
    const cueTrack = cueTrackId && subtitles[cueTrackId]

    const totalTracksCount = currentFile ? currentFile.subtitles.length : 0
    if (!cueTrack)
      return {
        totalTracksCount,
        cards: [],
        cardsMap: {},
        fieldNames: fieldsCuePriority,
        linkedTrackIds: [],
        excludedTracks: Object.values(subtitles),
        getFieldsPreviewFromCardsBase: () => ({}),
      }

    const includedTracks = fieldsCuePriority.map(
      (fieldName) => fieldsToTracks[fieldName]
    )

    const {
      cards,
      cardsMap,
    }: {
      cards: SubtitlesCardBase[]
      cardsMap: Record<string, SubtitlesCardBase>
    } = combineSubtitles(fieldsToTracks, subtitles, fieldsCuePriority)

    return {
      totalTracksCount,
      cards,
      cardsMap,
      fieldNames: fieldsCuePriority,
      linkedTrackIds: fieldsCuePriority
        .map((f) => fieldsToTracks[f])
        .filter((id): id is string => Boolean(id)),
      excludedTracks: Object.values(subtitles).filter(
        (track) => !includedTracks.includes(track.id)
      ),
      getFieldsPreviewFromCardsBase: (cardsBase: SubtitlesCardBase) => {
        const preview: Dict<string, string> = {}
        for (const trackId in cardsBase.fields) {
          preview[trackId] = (cardsBase.fields[trackId] || [])
            .map((index) => subtitles[trackId].chunks[index].text)
            .join('\n')
        }
        return preview
      },
    }
  }
)

const DELIMITER = '///'
function subBaseClipId(trackId: string, chunkIndex: number) {
  return trackId + DELIMITER + chunkIndex
}
function combineSubtitles(
  fieldsToTracks: SubtitlesFlashcardFieldsLinks,
  subtitles: SubtitlesState,
  fieldsCuePriority: TransliterationFlashcardFieldName[]
) {
  type ChunkClip = PrimaryClip & { trackId: SubtitlesTrackId }
  const tracksAsClips: ChunkClip[] = Object.values(fieldsToTracks)
    .filter((trackId) => trackId && subtitles[trackId])
    .flatMap((trackId) => {
      const track = subtitles[trackId]
      return track.chunks.map((chunk, i) => ({
        clipwaveType: 'Primary' as const,
        id: subBaseClipId(trackId, i),
        start: chunk.start,
        end: chunk.end,
        trackId,
      }))
    })
    .sort((a, b) => a.start - b.start)
  const getChunkSpecs = (id: string) => {
    const [trackId, chunkIndexString] = id.split(DELIMITER)
    const chunkIndex = +chunkIndexString
    const chunk = subtitles[trackId].chunks[+chunkIndex]
    if (!chunk)
      throw new Error(
        `Could not display subtitles chunk for track ${trackId} at position ${chunkIndex}`
      )
    return {
      trackId,
      chunkIndex,
      chunk,
    }
  }

  const regionsFromClips: WaveformRegion[] = tracksAsClips.length
    ? calculateRegions(
        tracksAsClips,
        tracksAsClips[tracksAsClips.length - 1].end,
        [
          {
            start: 0,
            itemIds: [],
            end: tracksAsClips[tracksAsClips.length - 1].end,
          },
        ]
      )?.regions || []
    : []
  const cardsMap: Record<string, SubtitlesCardBase> = {}
  const cards: SubtitlesCardBase[] = []
  const getItemIdsFromCardBase = (sb: SubtitlesCardBase) => {
    return Object.entries(sb.fields).flatMap(
      ([trackId, chunkIndexes]) =>
        chunkIndexes?.map((chunkIndex) => subBaseClipId(trackId, chunkIndex)) ||
        []
    )
  }
  regionsFromClips.forEach((region, regionIndex) => {
    const lastRegion: WaveformRegion | undefined =
      regionsFromClips[regionIndex - 1]
    const lastCard = cards[cards.length - 1]
    const lastCardItemIds = lastCard ? getItemIdsFromCardBase(lastCard) : []
    const newItemIds = region.itemIds.filter((id) => {
      return !lastCardItemIds.includes(id)
    })
    const itemsAlsoInLastCard = lastCardItemIds.filter((id) =>
      region.itemIds.includes(id)
    )

    const continuingLastCard =
      itemsAlsoInLastCard.length &&
      itemsAlsoInLastCard.some((idFromItemInLastCard) => {
        const { chunk: lastRegionChunk } = getChunkSpecs(idFromItemInLastCard)
        return newItemIds.some((id) => {
          const { chunk: newItemChunk } = getChunkSpecs(id)

          return overlapsSignificantly(
            lastRegionChunk,
            newItemChunk.start,
            newItemChunk.end
          )
        })
      })

    if (continuingLastCard) {
      newItemIds.forEach((itemId) => {
        if (!lastRegion.itemIds.includes(itemId)) {
          const { chunkIndex, trackId } = getChunkSpecs(itemId)
          lastCard.fields[trackId] = lastCard.fields[trackId] || []
          lastCard.fields[trackId]?.push(chunkIndex)
        }
        lastCard.end = getRegionEnd(regionsFromClips, regionIndex)
      })
    } else if (newItemIds.length) {
      const { id, newCard }: { id: string; newCard: SubtitlesCardBase } =
        getNewCardBase(
          newItemIds,
          getChunkSpecs,
          cards,
          fieldsCuePriority,
          region,
          regionsFromClips,
          regionIndex
        )
      cardsMap[id] = newCard
      cards.push(newCard)
    }
  })
  return { cards, cardsMap }
}

function getNewCardBase(
  newItemIds: string[],
  getChunk: (id: string) => {
    trackId: string
    chunkIndex: number
    chunk: SubtitlesChunk
  },
  cards: SubtitlesCardBase[],
  fieldsCuePriority: TransliterationFlashcardFieldName[],
  region: WaveformRegion,
  regionsFromClips: WaveformRegion[],
  regionIndex: number
) {
  const newFields: SubtitlesCardBase['fields'] = {}
  newItemIds.forEach((id) => {
    const { chunkIndex, trackId } = getChunk(id)
    newFields[trackId] = newFields[trackId] || []
    newFields[trackId]?.push(chunkIndex)
  })
  const index = cards.length
  const id = `${index}-----${Object.keys(fieldsCuePriority).join('___')}`

  fieldsCuePriority.forEach((fn) => (newFields[fn] = []))
  const newCard: SubtitlesCardBase = {
    index,
    id,
    clipwaveType: 'Secondary',
    start: region.start,
    end: getRegionEnd(regionsFromClips, regionIndex),
    fields: newFields,
  }
  return { id, newCard }
}
