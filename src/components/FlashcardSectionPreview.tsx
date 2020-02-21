import React, { useCallback, useMemo, ReactChild } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton, Tooltip } from '@material-ui/core'
import cn from 'classnames'
import * as r from '../redux'
import css from './FlashcardSection.module.css'
import {
  ChevronLeft,
  ChevronRight,
  Subtitles,
  Hearing,
  Layers,
} from '@material-ui/icons'
import * as actions from '../actions'
import FlashcardForm from './FlashcardSectionForm'
import { TransliterationFlashcardFields } from '../types/Project'
import FieldMenu, {
  useSubtitlesBySource,
} from './FlashcardSectionFormFieldPopoverMenu'

const FlashcardSectionPreview = ({
  clipsIds,
  cardBases,
  chunkIndex,
  mediaFile,
  fieldsToTracks,
}: {
  clipsIds: string[]
  cardBases: r.SubtitlesCardBases
  chunkIndex: number | null
  mediaFile: MediaFile
  fieldsToTracks: SubtitlesFlashcardFieldsLinks
}) => {
  const { subtitles, id } = mediaFile
  const fields = (cardBases ? {} : {}) as TransliterationFlashcardFields
  return (
    <section className={cn(css.preview)}>
      <section className={cn(css.previewFields)}>
        <Field
          fieldName="transcription"
          subtitles={subtitles}
          linkedTracks={fieldsToTracks}
          mediaFileId={mediaFile.id}
        >
          <p
            className={cn(css.previewFieldValue, css.previewFieldTranscription)}
          >
            {chunkIndex != null && (
              <FieldValue
                fieldName="transcription"
                value={fields.transcription}
              />
            )}
          </p>
        </Field>

        {'pronunciation' in fields && fields.pronunciation && (
          <Field
            fieldName="pronunciation"
            subtitles={subtitles}
            linkedTracks={fieldsToTracks}
            mediaFileId={mediaFile.id}
          >
            <p className={cn(css.previewFieldValue)}>
              {chunkIndex != null && (
                <FieldValue
                  fieldName="pronunciation"
                  value={fields.pronunciation}
                />
              )}
            </p>
          </Field>
        )}
        <Field
          fieldName="meaning"
          subtitles={subtitles}
          linkedTracks={fieldsToTracks}
          mediaFileId={mediaFile.id}
        >
          <p className={cn(css.previewFieldValue)}>
            {chunkIndex != null && (
              <FieldValue fieldName="meaning" value={fields.meaning} />
            )}
          </p>
        </Field>
        {fields.notes && (
          <Field
            fieldName="notes"
            subtitles={subtitles}
            linkedTracks={fieldsToTracks}
            mediaFileId={mediaFile.id}
          >
            <p className={cn(css.previewFieldValue)}>{fields.notes}</p>
          </Field>
        )}
      </section>
    </section>
  )
}
const FieldValue = ({
  fieldName,
  value,
}: {
  fieldName: FlashcardFieldName
  value: string | null
}) =>
  value ? (
    <>{value}</>
  ) : (
    <span className={css.emptyFieldPlaceholder}>{fieldName}</span>
  )

const Field = ({
  children,
  fieldName,
  subtitles,
  linkedTracks,
  mediaFileId,
}: {
  children: ReactChild
  fieldName: FlashcardFieldName
  subtitles: MediaSubtitlesRelation[]
  linkedTracks: SubtitlesFlashcardFieldsLinks
  mediaFileId: MediaFileId
}) => {
  const {
    embeddedSubtitlesTracks,
    externalSubtitlesTracks,
  } = useSubtitlesBySource(subtitles)
  const linkedSubtitlesTrack = linkedTracks[fieldName] || null
  return (
    <div className={css.previewField}>
      <FieldMenu
        embeddedSubtitlesTracks={embeddedSubtitlesTracks}
        externalSubtitlesTracks={externalSubtitlesTracks}
        linkedSubtitlesTrack={linkedSubtitlesTrack}
        mediaFileId={mediaFileId}
        fieldName={fieldName as TransliterationFlashcardFieldName}
      />
      {children}
    </div>
  )
}

const FRONT_SIDE = '{{FrontSide}}'
const HR = '<hr id="answer" />'
const TRANSCRIPTION = '<p class="transcription">{{transcription}}</p>'
const MEANING = '<p class="meaning">{{meaning}}</p>'
const PRONUNCIATION = `{{#pronunciation}}
<p class="pronunciation">{{pronunciation}}
</p>
{{/pronunciation}}`
const NOTES = `{{#notes}}
<p class="notes">{{notes}}
</p>
{{/notes}}`
const IMAGE = `{{#image}}
<div class="image">{{image}}</div>
{{/image}}`

const LISTENING_CARD = {
  name: 'Listening',
  questionFormat: [IMAGE, `♫{{sound}}`].join('\n'),
  answerFormat: [
    FRONT_SIDE,
    HR,
    TRANSCRIPTION,
    PRONUNCIATION,
    MEANING,
    NOTES,
  ].join('\n\n'),
}

export default FlashcardSectionPreview
