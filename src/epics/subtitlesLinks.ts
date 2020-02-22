import { combineEpics } from 'redux-observable'
import { flatMap, map } from 'rxjs/operators'
import { of, empty } from 'rxjs'
import * as r from '../redux'
import { TransliterationFlashcardFields } from '../types/Project'

const linkFieldToTrackRequest: AppEpic = (action$, state$) =>
  action$
    .ofType<LinkFlashcardFieldToSubtitlesTrackRequest>(
      A.LINK_FLASHCARD_FIELD_TO_SUBTITLES_TRACK_REQUEST
    )
    .pipe(
      map<LinkFlashcardFieldToSubtitlesTrackRequest, Action>(
        ({ mediaFileId, flashcardFieldName, subtitlesTrackId }) => {
          const previousLinks = r.getSubtitlesFlashcardFieldLinks(state$.value)
          const previouslyLinkedTrack = previousLinks[flashcardFieldName]

          if (
            !previouslyLinkedTrack ||
            !r.getClipIdsByMediaFileId(state$.value, mediaFileId).length
          )
            return r.linkFlashcardFieldToSubtitlesTrack(
              flashcardFieldName,
              mediaFileId,
              subtitlesTrackId
            )

          if (previouslyLinkedTrack) {
            const previouslyLinkedField = Object.keys(previousLinks).find(
              fn => {
                const fieldName = fn as TransliterationFlashcardFieldName
                return previousLinks[fieldName] === subtitlesTrackId
              }
            )

            const overwriteMessage = previouslyLinkedField
              ? `This action will clear the ${previouslyLinkedField} field and overwrite the ${flashcardFieldName} field for all these existing cards.`
              : `This action will overwrite the ${flashcardFieldName} field for all these existing cards.`
            const message =
              "It looks like you've already made some flashcards from this media file." +
              '\n\n' +
              overwriteMessage +
              '\n\n' +
              'Is that OK?'

            return r.confirmationDialog(
              message,
              r.linkFlashcardFieldToSubtitlesTrack(
                flashcardFieldName,
                mediaFileId,
                subtitlesTrackId
              )
            )
          }

          const message = `It looks like you've already made some flashcards from this media file.\n
This action will ${
            subtitlesTrackId ? 'overwrite' : 'clear'
          } the ${flashcardFieldName} field for all these existing cards.\n
Is that OK? `
          return r.confirmationDialog(
            message,
            r.linkFlashcardFieldToSubtitlesTrack(
              flashcardFieldName,
              mediaFileId,
              subtitlesTrackId
            )
          )
        }
      )
    )

const linkFieldToTrack: AppEpic = (action$, state$) =>
  action$
    .ofType<LinkFlashcardFieldToSubtitlesTrack>(
      A.LINK_FLASHCARD_FIELD_TO_SUBTITLES_TRACK
    )
    .pipe(
      flatMap(action => {
        const highlightedClip = r.getHighlightedClip(state$.value)
        if (!highlightedClip) return empty()

        const currentNoteType = r.getCurrentNoteType(state$.value)
        if (!currentNoteType) return empty()

        const {
          [action.flashcardFieldName]: newValue,
        } = r.getNewFieldsFromLinkedSubtitles(
          state$.value,
          currentNoteType,
          highlightedClip
        ) as TransliterationFlashcardFields

        if (!newValue.trim()) return empty()

        return of(
          r.editClip(highlightedClip.id, null, {
            fields: { [action.flashcardFieldName]: newValue },
          })
        )
      })
    )

export default combineEpics(linkFieldToTrackRequest, linkFieldToTrack)
