// https://vitest.dev/config/
import { UserConfig } from 'vitest/config'

export const integrationConfig: UserConfig = {
  test: {
    testTimeout: 60000,
    globals: true,
    // TODO: after removing nodeIntegration, delete this line:
    environment: 'jsdom',
    reporters: ['verbose'],
    threads: false,
    include: ['src/test/**/*.integration.ts'],
    deps: {
      inline: ['@mui/material'],
    },
  },
}

export default integrationConfig
