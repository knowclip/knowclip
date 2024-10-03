import { ThemeOptions } from '@mui/material'

const getThemeSpecs = ({
  disableAnimations,
}: {
  disableAnimations: boolean
}): ThemeOptions => ({
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '.8rem',
        },
      },
    },
    MuiCssBaseline: disableAnimations
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
  transitions: disableAnimations
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
})

export default getThemeSpecs
