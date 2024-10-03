// https://vitest.dev/config/
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    typecheck: {
      tsconfig: './tsconfig.vitest.json',
    },
  },
})
