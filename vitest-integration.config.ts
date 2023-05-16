// https://vitest.dev/config/
import { UserConfig } from 'vitest/config'
import path from 'path'

export const integrationConfig: UserConfig = {
  resolve: {
    alias: {
      preloaded: path.resolve(__dirname, 'src', 'node'),
    },
  },
  test: {
    testTimeout: 60000,
    threads: false,
    include: ['src/test/**/*.integration.ts'],
    deps: {
      inline: ['@mui/material'],
    },
    env: process.env.VITE_INTEGRATION_DEV
      ? {
          VITE_INTEGRATION_DEV: process.env.VITE_INTEGRATION_DEV,
        }
      : {},
  },
}

export default integrationConfig
