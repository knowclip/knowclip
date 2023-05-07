const themeSpecs = {
  palette: {},
  overrides: {
    MuiTooltip: {
      tooltip: {
        fontSize: '.8rem',
      },
    },
    ...(process.env.REACT_APP_CHROMEDRIVER
      ? {
          MuiCssBaseline: {
            '@global': {
              '*, *::before, *::after': {
                transition: 'none !important',
                animation: 'none !important',
              },
            },
          },
          transitions: () => 'none',
        }
      : null),
  },
}

export default themeSpecs
