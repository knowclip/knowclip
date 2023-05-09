import { UserConfig } from 'vitest/config'
import integrationConfig from './vitest-integration.config'

const config: UserConfig = {
  ...integrationConfig,
  test: {
    ...integrationConfig.test,
    include: ['src/test/**/*.fixture.ts'],
  },
}

export default config
