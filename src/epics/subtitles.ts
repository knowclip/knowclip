import { ofType, combineEpics } from 'redux-observable'
import {
  mergeMap,
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
import { of, Observable, EMPTY } from 'rxjs'
import r from '../redux'
import A from '../types/ActionType'
import { from } from 'rxjs'
import { uuid } from '../utils/sideEffects'
import { areSameFile } from '../utils/files'
import {
  getFlashcardTextFromCardBase,
  SubtitlesFileWithTrack,
} from '../selectors'
import { afterUpdates } from '../utils/afterUpdates'
import { ClipwaveCallbackEvent, msToSeconds } from 'clipwave'
import { TransliterationFlashcardFields } from '../types/Project'
import { CLIPWAVE_ID } from '../utils/clipwave'
import { isWaveformItemSelectable } from '../utils/clipwave/isWaveformItemSelectable'

const makeClipsFromSubtitles: AppEpic = (
  action$,
  state$,
  { pauseMedia, setCurrentTime, getMediaPlayer }
) =>
  action$.pipe(
    ofType(A.makeClipsFromSubtitles),
    mergeMap<MakeClipsFromSubtitles, Observable<Action>>(
      ({ fileId, fieldNamesToTrackIds, tags, includeStill }) => {
        const tracksValidation = validateTracks(
          state$.value,
          fieldNamesToTrackIds
        )

        pauseMedia()
        setCurrentTime(0)

        if (tracksValidation.status === 'NO_LINKS_GIVEN')
          return of(
            r.simpleMessageSnackbar(
              'Please choose a subtitles track to make cards from before proceeding.'
            ),
            r.showSubtitlesClipsDialogRequest()
          )

        if (tracksValidation.status === 'MISSING_FILE_RECORDS')
          return from([
            r.simpleMessageSnackbar(
              `The following subtitles could not be read: ${tracksValidation.result
                .map(({ label }) => label)
                .join(', ')}`
            ),
            r.showSubtitlesClipsDialogRequest(),
          ])

        if (tracksValidation.status === 'MISSING_TRACKS') {
          const missingTracks = Object.entries(
            tracksValidation.fieldNamesToFiles
          ) as [TransliterationFlashcardFieldName, SubtitlesFile][]
          const openMissingSubtitlesFailure = action$.pipe(
            ofType(A.openFileFailure),
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
                    ofType(A.openFileSuccess),
                    filter((a) => areSameFile(file, a.validatedFile)),
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

        return from([
          r.deleteCards(
            r.getClipIdsByMediaFileId(state$.value, currentFile.id)
          ),
          r.setDefaultClipSpecs({ tags, includeStill }),
          ...Object.keys(fieldNamesToTrackIds).map((badTypefieldName) => {
            const fieldName = badTypefieldName as FlashcardFieldName
            const trackId = fieldNamesToTrackIds[fieldName] || null
            const action = r.linkFlashcardFieldToSubtitlesTrack(
              fieldName,
              currentFile.id,
              trackId
            )
            return action
          }),
        ]).pipe(
          concat(
            afterUpdates(async () => {
              const linkedFieldNames = Object.keys(
                r.getSubtitlesFlashcardFieldLinks(state$.value)
              ) as TransliterationFlashcardFieldName[]
              const currentNoteType = r.getCurrentNoteType(state$.value)
              if (!currentNoteType) throw new Error('Note type not found')

              const cardsBases = r.getSubtitlesCardBases(state$.value)
              const { clips, cards } = cardsBases.cards.reduce(
                (acc, cardBase) => {
                  const newFields = linkedFieldNames.reduce(
                    (fields, fieldName) => {
                      const trackId = fieldNamesToTrackIds[fieldName] || null
                      const fieldText = getFlashcardTextFromCardBase(
                        cardBase,
                        trackId
                          ? r.getSubtitlesTrack(state$.value, trackId)
                          : null
                      )
                      fields[fieldName] = fieldText
                        .filter((t) => t.trim())
                        .join(' ')
                      return fields
                    },
                    (currentNoteType === 'Simple'
                      ? {
                          transcription: '',
                          meaning: '',
                          notes: '',
                        }
                      : {
                          transcription: '',
                          meaning: '',
                          notes: '',
                          pronunciation: '',
                        }) as TransliterationFlashcardFields
                  )
                  const { clip, flashcard } = r.getNewClipAndCard(
                    state$.value,
                    {
                      start: cardBase.start,
                      end: cardBase.end,
                    },
                    fileId,
                    uuid(),
                    newFields
                  )

                  if (flashcard.fields.transcription?.trim()) {
                    acc.cards.push(flashcard)
                    acc.clips.push(clip)
                  }

                  return acc
                },
                { clips: [] as Clip[], cards: [] as Flashcard[] }
              )

              return from([r.addClips(clips, cards, fileId)])
            }),
            afterUpdates(async () => {
              window.dispatchEvent(
                new ClipwaveCallbackEvent(CLIPWAVE_ID, ({ actions }) => {
                  const mediaPlayer = getMediaPlayer()
                  actions.selectNextItemAndSeek(
                    mediaPlayer,
                    isWaveformItemSelectable
                  )
                })
              )

              return EMPTY
            })
          )
        )
      }
    )
  )

const showSubtitlesClipsDialogRequest: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType(A.showSubtitlesClipsDialogRequest),
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
        'This action will PERMANENTLY delete any clips and cards you made for this current file. Are you sure you want to continue?',
        r.subtitlesClipDialog()
      )
    })
  )

const goToSubtitlesChunk: AppEpic = (action$, state$, { setCurrentTime }) =>
  action$.pipe(
    ofType(A.goToSubtitlesChunk),
    tap(({ chunkIndex, subtitlesTrackId }) => {
      const track = r.getSubtitlesTrack(state$.value, subtitlesTrackId)
      if (!track) {
        console.error('Track not found')
        return
      }
      const { start } = track.chunks[chunkIndex]
      setCurrentTime(msToSeconds(start))
      return
    }),
    ignoreElements()
  )

function validateTracks(
  state: AppState,
  fieldNamesToTrackIds: SubtitlesFlashcardFieldsLinks
):
  | { status: 'NO_LINKS_GIVEN' }
  | { status: 'MISSING_FILE_RECORDS'; result: SubtitlesFileWithTrack[] }
  | {
      status: 'MISSING_TRACKS'
      fieldNamesToFiles: {
        [K in TransliterationFlashcardFieldName]?: SubtitlesFile
      }
    }
  | {
      status: 'SUCCESS'
      cueTrackFieldName: TransliterationFlashcardFieldName
    } {
  if (
    !Object.values(fieldNamesToTrackIds).find(
      (trackId) => trackId && trackId.trim()
    )
  )
    return { status: 'NO_LINKS_GIVEN' }

  const allMediaSubtitles = r.getSubtitlesFilesWithTracks(state)
  const missingFileRecords = allMediaSubtitles.all.filter(
    ({ sourceFile: file }) => !file
  )
  if (missingFileRecords.length)
    return { status: 'MISSING_FILE_RECORDS', result: missingFileRecords }

  const missingTracks = allMediaSubtitles.all.filter(
    (s): s is SubtitlesFileWithTrack & { file: SubtitlesFile; track: null } =>
      !s.track
  )

  if (missingTracks.length) {
    const fieldNamesToFiles = {} as {
      [K in TransliterationFlashcardFieldName]?: SubtitlesFile
    }
    for (const fn in fieldNamesToTrackIds) {
      const fieldName = fn as TransliterationFlashcardFieldName
      const trackId = fieldNamesToTrackIds[fieldName]
      const missingTrack = missingTracks.find((t) => t.relation.id === trackId)
      if (missingTrack) fieldNamesToFiles[fieldName] = missingTrack.file
    }
    return { status: 'MISSING_TRACKS', fieldNamesToFiles }
  }

  const cueTrackFieldName = r.CUES_BASE_PRIORITY.find(
    (fieldName) => fieldNamesToTrackIds[fieldName]
  ) as TransliterationFlashcardFieldName

  return {
    status: 'SUCCESS',
    cueTrackFieldName,
  }
}

export default combineEpics(
  makeClipsFromSubtitles,
  showSubtitlesClipsDialogRequest,
  goToSubtitlesChunk
)
