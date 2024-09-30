import { createTheme } from '@mui/material/styles'
import getThemeSpecs from '../themeSpecs'

export const theme = createTheme({
  ...getThemeSpecs({
    disableAnimations: Boolean(window.electronApi?.env.VITEST),
  }),
})
