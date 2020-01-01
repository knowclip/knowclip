import * as r from '../redux'
import { FileEventHandlers } from './eventHandlers'
import parseProject from '../utils/parseProject'
import { promises } from 'fs'
import moment from 'moment'

const { readFile } = promises

export default {
  openRequest: async ({ file }, filePath, state, effects) => {
    return [
      // TODO: check differences/opened time
      r.openFileSuccess(file, filePath),
    ]
  },
  openSuccess: [
    async ({ validatedFile, filePath }, state, effects) => {
      const projectJson = await readFile(filePath, 'utf8')
      const project = parseProject(projectJson)

      if (!project) return [r.simpleMessageSnackbar('Could not open project')]

      const addNewMediaFiles = project.mediaFiles
        .filter(
          validatedFile => !r.getFile(state, 'MediaFile', validatedFile.id)
        )
        .map(validatedFile => r.addFile(validatedFile))
      console.log('subbies', project.subtitles)
      const addNewSubtitlesFiles = project.subtitles
        .filter(
          subtitlesFile =>
            !r.getFile(state, subtitlesFile.type, subtitlesFile.id)
        )
        .map(file => r.addFile(file))
      // .map(track =>
      //   r.addFile(
      //     track.type === 'EmbeddedSubtitlesTrack'
      //       ? ({
      //           id: track.id,
      //           type: 'VttConvertedSubtitlesFile',
      //           parentId: track.mediaFileId,
      //           streamIndex: track.streamIndex,
      //           parentType: 'MediaFile',
      //         } as VttConvertedSubtitlesFile)
      //       : ({
      //           id: track.id,
      //           type: 'ExternalSubtitlesFile',
      //           parentId: track.mediaFileId,
      //           name: basename(track.filePath),
      //         } as ExternalSubtitlesFile)
      //   )
      // )
      console.log({ addNewSubtitlesFiles })
      const loadFirstMediaFile = project.mediaFiles.length
        ? [r.openFileRequest(project.mediaFiles[0])]
        : []

      return [
        ...addNewMediaFiles,
        ...addNewSubtitlesFiles, // maybe should happen when opening media
        r.openProject(
          validatedFile,
          project.clips,
          moment()
            .utc()
            .format()
        ),
        ...loadFirstMediaFile,
      ]
    },
  ],

  locateRequest: async ({ file }, state, effects) => [
    r.fileSelectionDialog(
      `Please locate this project file "${file.name}"`,
      file
    ),
  ],

  locateSuccess: null,
  deleteRequest: [async (file, state, effects) => [r.deleteFileSuccess(file)]],
  deleteSuccess: [
    async ({ file }, state, effects) =>
      file.mediaFileIds.map(id => r.deleteFileRequest('MediaFile', id)),
  ],
} as FileEventHandlers<ProjectFile>
