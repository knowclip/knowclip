import * as r from '../redux'
import { FileEventHandlers } from './types'
import { of, empty, from } from 'rxjs'
import { map } from 'rxjs/operators'

const getClipsFromProjectFile = async (
  project: ProjectFileRecord,
  filePath: FilePath
): Promise<Array<Clip>> => []

export default {
  loadRequest: async (fileRecord, filePath, state, effects) => [
    // check differences?
    // update lastOpened?
    r.loadFileSuccess(fileRecord, filePath),
  ],
  loadSuccess: (project, filePath, state, effects) => {
    // const projectJson = ((await readFile(filePath)) as unknown) as string
    // const project = parseProject(projectJson)

    const mediaFiles = project.mediaFiles.map(
      id => state.fileRecords.MediaFile[id]
    )

    // rename to setCurrentProject?
    return from(getClipsFromProjectFile(project, filePath)).pipe(
      map(clips => r.openProject(project, mediaFiles, clips))
    ) // also open first media file
    // return from([
    //   r.openProject(
    //     project,
    //     {
    //       id: project.id,
    //       type: 'ProjectFile',
    //       lastOpened: moment()
    //         .utc()
    //         .format(),
    //       // filePath: filePath,
    //       name: project.name,
    //       mediaFiles,
    //       error: null,
    //       noteType: project.noteType,
    //     },
    //     project.mediaFiles
    //   ),
    //   ({
    //     type: projectMetadata
    //       ? 'CREATED NEW PROJECT METADATA'
    //       : 'open old project metadata',
    //   } as unknown) as Action,
    // ])
  },
  loadFailure: null,
  locateRequest: async (fileRecord, state, effects) => [
    r.fileSelectionDialog(
      `Please locate this project file ${fileRecord.name}`,
      fileRecord
    ),
  ],
  locateSuccess: null,
} as FileEventHandlers<ProjectFileRecord>
