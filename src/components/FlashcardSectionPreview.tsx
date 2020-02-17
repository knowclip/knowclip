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
import { CardPreview } from '../redux'
import { TransliterationFlashcardFields } from '../types/Project'
import FieldMenu, {
  useSubtitlesBySource,
} from './FlashcardSectionFormFieldPopoverMenu'

const FlashcardSectionPreview = ({
  clipsIds,
  preview,
  mediaFile,
}: {
  clipsIds: string[]
  preview: CardPreview | null
  mediaFile: MediaFile
}) => {
  const { fieldsToTracks } = useSelector((state: AppState) => ({
    fieldsToTracks: r.getSubtitlesFlashcardFieldLinks(state),
  }))

  const { subtitles, id } = mediaFile
  const fields = (preview
    ? preview.fields
    : {}) as TransliterationFlashcardFields
  return (
    <section className={cn(css.preview)}>
      <Field
        fieldName="transcription"
        subtitles={subtitles}
        linkedTracks={fieldsToTracks}
        mediaFileId={mediaFile.id}
      >
        <p className={cn('transcription', css.previewFieldValue)}>
          {fields.transcription}
        </p>
      </Field>

      {'pronunciation' in fields && (
        <p className={cn('pronunciation', css.previewFieldValue)}>
          {fields.pronunciation}
        </p>
      )}
      <p className={cn('meaning', css.previewFieldValue)}>{fields.meaning}</p>
      {fields.notes && (
        <p className={cn('notes', css.previewFieldValue)}>{fields.notes}</p>
      )}
    </section>
  )
}

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
