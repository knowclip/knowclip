import { ThemeOptions } from '@mui/material'
import { VITEST } from './env'

const themeSpecs: ThemeOptions = {
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '.8rem',
        },
      },
    },
    MuiCssBaseline: VITEST
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
  transitions: VITEST
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
