import { ThemeProvider, createTheme } from '@mui/material/styles'
import { PropsWithChildren } from 'react'
import getThemeSpecs from '../themeSpecs'

const theme = createTheme({
  ...getThemeSpecs({
    disableAnimations: Boolean(window.electronApi?.env.VITEST),
  }),
  palette: {
    mode: 'dark',
    // ...(themeSpecs.palette || {}),
  },
})

const DarkTheme = ({ children }: PropsWithChildren) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

export default DarkTheme
