import React, { ReactChild } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import themeSpecs from '../themeSpecs'

const theme = createTheme({
  ...themeSpecs,
  palette: {
    mode: 'dark',
    // ...(themeSpecs.palette || {}),
  },
})

const DarkTheme = ({ children }: { children: ReactChild }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
)

export default DarkTheme
