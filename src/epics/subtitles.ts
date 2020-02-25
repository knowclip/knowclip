import { ofType, combineEpics } from 'redux-observable'
import {
  flatMap,
  map,
  filter,
  take,
  concatMap,
  ignoreElements,
  startWith,
  takeUntil,
  endWith,
  concat,
  tap,
} from 'rxjs/operators'
import { of, Observable } from 'rxjs'
import * as r from '../redux'
import { from } from 'rxjs'
import { uuid } from '../utils/sideEffects'
import { areSameFile } from '../utils/files'

const makeClipsFromSubtitles: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, MakeClipsFromSubtitles>(A.MAKE_CLIPS_FROM_SUBTITLES),
    flatMap<MakeClipsFromSubtitles, Observable<Action>>(
      ({ fileId, fieldNamesToTrackIds, tags }) => {
        const includeStill = false
        const tracksValidation = validateTracks(
          state$.value,
          fieldNamesToTrackIds
        )

        if (tracksValidation.status === 'MISSING_FILE_RECORDS')
          return from([
            r.simpleMessageSnackbar(
              `The following subtitles could not be read: ${tracksValidation.result
                .map(({ label }) => label)
                .join(', ')}`
            ),
            r.subtitlesClipsDialogRequest(),
          ])

        if (tracksValidation.status === 'MISSING_TRACKS') {
          const missingTracks = Object.entries(
            tracksValidation.fieldNamesToFiles
          ) as [TransliterationFlashcardFieldName, SubtitlesFile][]
          const openMissingSubtitlesFailure = action$.pipe(
            ofType<Action, OpenFileFailure>('OPEN_FILE_FAILURE'),
            filter(({ file }) =>
              missingTracks.some(([, t]) => t.id === file.id)
            ),
            take(1)
          )
          return from(missingTracks).pipe(
            concatMap(([, file]) =>
              of(r.openFileRequest(file)).pipe(
                concat(
                  action$.pipe(
                    ofType<Action, OpenFileSuccess>('OPEN_FILE_SUCCESS'),
                    filter(a => areSameFile(file, a.validatedFile)),
                    take(1),
                    ignoreElements()
                  )
                )
              )
            ),
            startWith(r.closeDialog()),
            takeUntil(openMissingSubtitlesFailure),
            // either this or right on to successful clip creation? this will require another action though.
            // same idea would be nice for export too`
            endWith(r.subtitlesClipDialog())
          )
        }

        const currentFile = r.getCurrentMediaFile(state$.value)
        if (!currentFile)
          return of(
            r.simpleMessageSnackbar(
              'Could not find media file to make clips from.'
            )
          )

        const clips: Clip[] = []
        const cards: Flashcard[] = []
        getClipsAndCardsFromSubtitles(
          tracksValidation.transcriptionTrack,
          fieldNamesToTrackIds,
          state$.value,
          fileId
        ).forEach(({ clip, flashcard }) => {
          clips.push(clip)
          cards.push(flashcard)
        })

        return from([
          r.deleteCards(
            r.getClipIdsByMediaFileId(state$.value, currentFile.id)
          ),
          r.setDefaultClipSpecs({ tags, includeStill }),
          ...Object.keys(fieldNamesToTrackIds).map(badTypefieldName => {
            const fieldName = badTypefieldName as FlashcardFieldName
            const trackId = fieldNamesToTrackIds[fieldName] || null
            return r.linkFlashcardFieldToSubtitlesTrack(
              fieldName,
              currentFile.id,
              trackId
            )
          }),
          r.addClips(clips, cards, fileId),
        ])
      }
    )
  )

const subtitlesClipsDialogRequest: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, ShowSubtitlesClipsDialogRequest>(
      A.SHOW_SUBTITLES_CLIPS_DIALOG_REQUEST
    ),
    map(() => {
      const tracks = r.getSubtitlesTracks(state$.value)
      if (!tracks.length)
        return r.simpleMessageSnackbar(
          'Please add a subtitles track and try again.'
        )
      const mediaFile = r.getCurrentMediaFile(state$.value)
      if (!mediaFile || !r.getCurrentFilePath(state$.value))
        return r.simpleMessageSnackbar(
          'Please locate this media file and try again.'
        )
      if (!r.getCurrentFileClips(state$.value).length)
        return r.subtitlesClipDialog()
      return r.confirmationDialog(
        'This action will delete any clips and cards you made for this current file. Are you sure you want to continue?',
        r.subtitlesClipDialog()
      )
    })
  )

const goToSubtitlesChunk: AppEpic = (action$, state$, { setCurrentTime }) =>
  action$.pipe(
    ofType<Action, GoToSubtitlesChunk>(A.GO_TO_SUBTITLES_CHUNK),
    tap(({ chunkIndex, subtitlesTrackId }) => {
      const track = r.getSubtitlesTrack(state$.value, subtitlesTrackId)
      if (!track) {
        console.error('Track not found')
        return
      }
      const { start } = track.chunks[chunkIndex]
      setCurrentTime(r.getSecondsAtX(state$.value, start))
      return
    }),
    ignoreElements()
  )

type SubtitlesGenerationFieldMapping = Partial<
  Record<TransliterationFlashcardFieldName, SubtitlesTrackId>
> & {
  transcription: SubtitlesTrackId
}

function validateTracks(
  state: AppState,
  fieldNamesToTrackIds: SubtitlesGenerationFieldMapping
):
  | { status: 'MISSING_FILE_RECORDS'; result: r.SubtitlesFileWithTrack[] }
  | {
      status: 'MISSING_TRACKS'
      fieldNamesToFiles: {
        [K in TransliterationFlashcardFieldName]?: SubtitlesFile
      }
    }
  | { status: 'SUCCESS'; transcriptionTrack: SubtitlesTrack } {
  const allMediaSubtitles = r.getSubtitlesFilesWithTracks(state)
  const missingFileRecords = allMediaSubtitles.all.filter(({ file }) => !file)
  if (missingFileRecords.length)
    return { status: 'MISSING_FILE_RECORDS', result: missingFileRecords }

  const missingTracks = allMediaSubtitles.all.filter(
    (s): s is r.SubtitlesFileWithTrack & { file: SubtitlesFile; track: null } =>
      !s.track
  )

  if (missingTracks.length) {
    const fieldNamesToFiles = {} as {
      [K in TransliterationFlashcardFieldName]?: SubtitlesFile
    }
    for (const fn in fieldNamesToTrackIds) {
      const fieldName = fn as TransliterationFlashcardFieldName
      const trackId = fieldNamesToTrackIds[fieldName]
      const missingTrack = missingTracks.find(t => t.relation.id === trackId)
      if (missingTrack) fieldNamesToFiles[fieldName] = missingTrack.file
    }
    return { status: 'MISSING_TRACKS', fieldNamesToFiles }
  }

  return {
    status: 'SUCCESS',
    transcriptionTrack: r.getSubtitlesTrack(
      state,
      fieldNamesToTrackIds.transcription
    ) as SubtitlesTrack,
  }
}

function getClipsAndCardsFromSubtitles(
  transcriptionTrack: SubtitlesTrack,
  fieldNamesToTrackIds: SubtitlesGenerationFieldMapping,
  state: AppState,
  fileId: string
) {
  const currentNoteType = r.getCurrentNoteType(state)
  if (!currentNoteType) throw new Error('Could not find note type.') // should be impossible

  // careful, pretty sure this mutates
  const sortedChunks = transcriptionTrack.chunks.sort(
    ({ start: a }, { start: b }) => a - b
  )
  return sortedChunks.map((chunk, chunkIndex) => {
    const fields =
      currentNoteType === 'Simple'
        ? {
            transcription: chunk.text,
            meaning: '',
            notes: '',
          }
        : {
            transcription: chunk.text,
            meaning: '',
            notes: '',
            pronunciation: '',
          }
    ;(Object.keys(fields) as Array<keyof typeof fields>).forEach(fieldName => {
      const trackId = fieldNamesToTrackIds[fieldName]
      fields[fieldName] = trackId
        ? r
            .getSubtitlesChunksWithinRange(
              state,
              trackId,
              chunk.start,
              chunk.end
            )
            .map(chunk => chunk.text)
            .join(' ')
        : ''
    })
    return r.getNewClipAndCard(
      state,
      {
        start: chunk.start,
        end:
          sortedChunks[chunkIndex + 1] &&
          chunk.end === sortedChunks[chunkIndex + 1].start
            ? chunk.end - 1
            : chunk.end,
      },
      fileId,
      uuid(),
      fields
    )
  })
}

export default combineEpics(
  makeClipsFromSubtitles,
  subtitlesClipsDialogRequest,
  goToSubtitlesChunk
)
