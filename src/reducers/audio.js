// @flow
const initialState: AudioState = {
  loop: true,
  currentFileIndex: 0,
  files: ({}: { [AudioFilePath]: AudioFileData }),
  filesOrder: [],
  isLoading: false,
  mediaFolderLocation: null,
}

const audio: Reducer<AudioState> = (
  state: AudioState = initialState,
  action: Object
) => {
  switch (action.type) {
    case 'TOGGLE_LOOP':
      return {
        ...state,
        loop: !state.loop,
      }

    case 'CHOOSE_AUDIO_FILES': {
      const { filePaths, noteTypeId } = action

      return {
        ...state,
        filesOrder: filePaths,
        files: filePaths.reduce((files, path) => {
          const fileData: AudioFileData = {
            path,
            clipsOrder: [],
            noteTypeId,
          }
          return { ...files, [path]: fileData }
        }, {}),
        isLoading: true,
        currentFileIndex: 0,
      }
    }

    case 'REMOVE_AUDIO_FILES':
      return {
        ...state,
        filesOrder: [],
        files: {},
        isLoading: false,
        currentFileIndex: 0,
      }

    case 'INITIALIZE_APP':
      return {
        ...state,
        isLoading: Boolean(state.filesOrder.length),
      }

    case 'SET_CURRENT_FILE':
      return {
        ...state,
        currentFileIndex: action.index,
      }

    case 'LOAD_AUDIO':
      return {
        ...state,
        isLoading: Boolean(action.filePath),
      }

    case 'LOAD_AUDIO_SUCCESS':
      return {
        ...state,
        isLoading: false,
      }

    case 'SET_MEDIA_FOLDER_LOCATION':
      return {
        ...state,
        mediaFolderLocation: action.directoryPath,
      }

    // case 'ASSIGN_NOTE_TYPE':

    // case 'ADD_WAVEFORM_SELECTION'
    default:
      return state
  }
}

export default audio
