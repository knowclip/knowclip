const themeSpecs = {
  overrides: {
    MuiTooltip: {
      tooltip: {
        fontSize: '.8rem',
      },
    },
    ...(process.env.REACT_APP_SPECTRON
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
  typography: {
    useNextVariants: true,
  },
}

export default themeSpecs
