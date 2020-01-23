import React, { useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Dialog,
  DialogActions,
  DialogContent,
  Button,
  Tabs,
  Tab,
  LinearProgress,
} from '@material-ui/core'
import * as r from '../redux'
import css from './Export.module.css'
import { showSaveDialog } from '../utils/electron'
import * as actions from '../actions'
import { DialogProps } from './Dialog/DialogProps'
import MediaTable from './ReviewAndExportMediaTable'

enum $ {
  exportApkgButton = 'export-apkg-button',
  continueButton = 'continue-button',
  exitButton = 'exit-button',
}

const Export = ({ open }: DialogProps<ReviewAndExportDialogData>) => {
  const dispatch = useDispatch()
  const closeDialog = useCallback(() => dispatch(actions.closeDialog()), [
    dispatch,
  ])

  const {
    currentMedia,
    clipsIds,
    currentFileId,
    projectMedia,
    progress,
  } = useSelector((state: AppState) => {
    const currentMedia = r.getCurrentMediaFile(state)
    return {
      currentMedia,
      clipsIds: currentMedia
        ? state.clips.idsByMediaFileId[currentMedia.id]
        : [],
      currentFileId: r.getCurrentFileId(state),
      projectMedia: r.getCurrentProjectMediaFiles(state),
      progress: state.user.progress,
    }
  })

  const [currentTabIndex, setCurrentTabIndex] = useState(0)
  const [selectionHasStarted, setSelectionHasStarted] = useState(false)
  const chooseTab = (index: number) => {
    setCurrentTabIndex(index)
    setSelectionHasStarted(false)
  }
  const startSelection = useCallback(() => setSelectionHasStarted(true), [
    setSelectionHasStarted,
  ])

  const [selectedIds, setSelectedIds] = useState(clipsIds)
  const exportApkg = useCallback(
    () =>
      showSaveDialog('Anki APKG file', ['apkg']).then(
        (path: string | null) =>
          path && dispatch(actions.exportApkgRequest(selectedIds, path))
      ),
    [dispatch, selectedIds]
  )
  const csvAndMp3ExportDialog = useCallback(
    () => dispatch(actions.csvAndMp3ExportDialog(selectedIds)),
    [dispatch, selectedIds]
  )
  const exportMarkdown = useCallback(
    () => dispatch(actions.exportMarkdown(selectedIds)),
    [dispatch, selectedIds]
  )

  const onSelect = useCallback(
    (id: string) =>
      setSelectedIds(selectedIds =>
        selectedIds.includes(id)
          ? selectedIds.filter(x => x !== id)
          : selectedIds.concat(id)
      ),
    [setSelectedIds]
  )
  const onSelectAll = useCallback(
    (ids: string[]) =>
      setSelectedIds(selectedIds =>
        ids.every(id => selectedIds.includes(id))
          ? selectedIds.filter(id => !ids.includes(id))
          : [...new Set([...selectedIds, ...ids])]
      ),
    [setSelectedIds]
  )
  const [expandedTableIndex, setExpandedTableIndex] = useState(() =>
    projectMedia.findIndex(metadata => metadata.id === currentFileId)
  )
  const onClickTable = useCallback(
    (index: number) => {
      const mediaMetadata = projectMedia[index]
      if (mediaMetadata && currentMedia && mediaMetadata.id !== currentMedia.id)
        dispatch(actions.openFileRequest(mediaMetadata))
      setExpandedTableIndex(index)
    },
    [dispatch, currentMedia, setExpandedTableIndex, projectMedia]
  )

  const dialogContent = (
    <DialogContent>
      {currentTabIndex === 0 && (
        <section className={css.introText}>
          <p>
            Export an Anki .apkg file. This format is best for{' '}
            <strong>starting a new deck.</strong>
          </p>
          <p>
            If you want to update some flashcards you've previously exported, or
            add some new cards to a previously exported deck, you probably want
            to export CSV and MP3s.
          </p>
        </section>
      )}
      {currentTabIndex === 1 && (
        <section className={css.introText}>
          <p>Export a Comma-Separated-Values file along with MP3s.</p>
          <p>
            This format is best for{' '}
            <strong>updating or adding to a deck</strong> which you've
            previously exported.
          </p>
        </section>
      )}

      {currentTabIndex === 2 && (
        <section className={css.introText}>
          <p>Export a Markdown file.</p>
          <p>
            This lets you <strong>review all your notes</strong> in a handy text
            format.
          </p>
        </section>
      )}
      {selectionHasStarted &&
        projectMedia.map((metadata, i) => (
          <MediaTable
            key={metadata.id}
            open={i === expandedTableIndex}
            mediaIndex={i}
            onClick={onClickTable}
            media={metadata}
            selectedIds={selectedIds}
            onSelect={onSelect}
            onSelectAll={onSelectAll}
          />
        ))}
    </DialogContent>
  )

  return (
    <Dialog
      open={open}
      onClose={useCallback(() => dispatch(actions.closeDialog()), [dispatch])}
      fullScreen={selectionHasStarted}
    >
      <Tabs value={currentTabIndex} className={css.tabs}>
        <Tab label="Export APKG" onClick={() => chooseTab(0)} />
        <Tab label="Export CSV & MP3" onClick={() => chooseTab(1)} />
        <Tab label="Export MD" onClick={() => chooseTab(2)} />
      </Tabs>
      {progress ? (
        <DialogContent>
          <LinearProgress variant="determinate" value={progress.percentage} />
          <p className={css.progressMessage}>{progress.message}</p>
        </DialogContent>
      ) : (
        dialogContent
      )}

      {selectionHasStarted ? (
        <DialogActions>
          <Button
            onClick={closeDialog}
            disabled={Boolean(progress)}
            id={$.exitButton}
          >
            Exit
          </Button>
          {currentTabIndex === 1 && (
            <Button
              variant="contained"
              color="primary"
              disabled={Boolean(progress)}
              onClick={csvAndMp3ExportDialog}
            >
              Export CSV and MP3 from selected clips
            </Button>
          )}
          {currentTabIndex === 2 && (
            <Button
              variant="contained"
              color="primary"
              disabled={Boolean(progress)}
              onClick={exportMarkdown}
            >
              Export Markdown from selected clips
            </Button>
          )}
          {currentTabIndex === 0 && (
            <Button
              variant="contained"
              color="primary"
              disabled={Boolean(progress)}
              onClick={exportApkg}
              id={$.exportApkgButton}
            >
              Export Anki Deck from selected clips
            </Button>
          )}
        </DialogActions>
      ) : (
        <DialogActions>
          <Button disabled={Boolean(progress)} onClick={closeDialog}>
            Exit
          </Button>
          <Button
            disabled={Boolean(progress)}
            onClick={startSelection}
            id={$.continueButton}
          >
            Continue
          </Button>
        </DialogActions>
      )}
    </Dialog>
  )
}

export default Export

export { $ as reviewAndExport$ }
