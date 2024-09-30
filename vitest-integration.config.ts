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
    env: {
      ...(process.env.VITEST ? { VITEST: process.env.VITEST } : null),
      ...(process.env.BUILD_NUMBER
        ? { BUILD_NUMBER: process.env.BUILD_NUMBER }
        : null),
      ...(process.env.DEV ? { DEV: process.env.DEV } : null),
      ...(process.env.VITE_INTEGRATION_DEV
        ? { VITE_INTEGRATION_DEV: process.env.VITE_INTEGRATION_DEV }
        : null),
      ...(process.env.PERSISTED_STATE_PATH
        ? { PERSISTED_STATE_PATH: process.env.PERSISTED_STATE_PATH }
        : null),
      ...(process.env.NODE_ENV ? { NODE_ENV: process.env.NODE_ENV } : null),
    },
    deps: {
      inline: ['@mui/material'],
    },
  },
}

export default integrationConfig
