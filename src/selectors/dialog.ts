
export const getCurrentDialog = (state: AppState): DialogData | null => state.dialog.queue[0] || null
