// https://vitest.dev/config/
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      preloaded: path.resolve(__dirname, 'src', 'node'),
    },
  },
  test: {
    typecheck: {
      tsconfig: './tsconfig.vitest.json',
    },
  },
})
