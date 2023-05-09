import { ThemeOptions } from '@mui/material'

const themeSpecs: ThemeOptions = {
  palette: {},
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '.8rem',
        },
      },
    },
    MuiCssBaseline: process.env.REACT_APP_CHROMEDRIVER
      ? {
          styleOverrides: {
            '@global': {
              '*, *::before, *::after': {
                transition: 'none !important',
                animation: 'none !important',
              },
            },
          },
        }
      : {},
  },
  transitions: process.env.REACT_APP_CHROMEDRIVER
    ? {
        duration: {
          shortest: 0,
          shorter: 0,
          short: 0,
          standard: 0,
          complex: 0,
          enteringScreen: 0,
          leavingScreen: 0,
        },
      }
    : {},
}

export default themeSpecs
