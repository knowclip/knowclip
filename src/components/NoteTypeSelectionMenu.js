// import React, { Component } from 'react'
// import { connect } from 'react-redux'
// import {
//   MenuItem,
//   ListItemText,
//   ListItemSecondaryAction,
//   IconButton,
// } from '@material-ui/core'
// import * as r from '../redux'
// import { Edit as EditIcon, Add as AddIcon } from '@material-ui/icons'
// import css from './NoteTypeSelectionMenu.module.css'

// export class NoteTypeSelectionMenu extends Component {
//   render() {
//     const {
//       noteTypes,
//       selectedNoteTypeId,
//       selectNoteType,
//       editNoteTypeDialog,
//       newNoteTypeDialog,
//     } = this.props
//     return (
//       <>
//         {noteTypes.map(({ id, name }) => (
//           <MenuItem
//             key={id}
//             button
//             selected={id === selectedNoteTypeId}
//             classes={{ root: css.listItem, selected: css.selected }}
//             onClick={() => selectNoteType(id)}
//           >
//             <ListItemText>{name}</ListItemText>
//             <ListItemSecondaryAction>
//               <IconButton onClick={() => editNoteTypeDialog(id)}>
//                 <EditIcon />
//               </IconButton>
//             </ListItemSecondaryAction>
//           </MenuItem>
//         ))}

//         <MenuItem onClick={() => newNoteTypeDialog()}>
//           <ListItemText>New note type</ListItemText>

//           <AddIcon />
//         </MenuItem>
//       </>
//     )
//   }
// }

// const mapStateToProps = state => {
//   const currentFile = r.getCurrentFile(state)
//   const defaultNoteTypeId = r.getDefaultNoteTypeId(state)

//   return {
//     noteTypes: r.getNoteTypes(state),
//     defaultNoteTypeId,
//     currentFileId: r.getCurrentFileId(state),
//     selectedNoteTypeId: currentFile
//       ? currentFile.noteTypeId
//       : defaultNoteTypeId,
//   }
// }

// const mapDispatchToProps = {
//   setDefaultNoteType: r.setDefaultNoteType,
//   setAudioFileNoteTypeRequest: r.setAudioFileNoteTypeRequest,
//   editNoteTypeDialog: r.editNoteTypeDialog,
//   newNoteTypeDialog: r.newNoteTypeDialog,
// }

// const mergeProps = (
//   { currentFileId, ...stateProps },
//   { setDefaultNoteType, setAudioFileNoteTypeRequest, ...dispatchProps },
//   ownProps
// ) => ({
//   selectNoteType: currentFileId
//     ? id => setAudioFileNoteTypeRequest(currentFileId, id)
//     : setDefaultNoteType,
//   ...stateProps,
//   ...dispatchProps,
//   ...ownProps,
// })

// export default connect(
//   mapStateToProps,
//   mapDispatchToProps,
//   mergeProps
// )(NoteTypeSelectionMenu)
