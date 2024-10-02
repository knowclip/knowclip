import { UserConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const external = ['better-sqlite3', 'archiver']
const config: UserConfig = {
  main: {
    resolve: {
      alias: {
        setUpMocks: path.resolve(__dirname, 'src', 'mockUtils', 'main.ts'),
      },
    },
    build: {
      lib: {
        entry: 'electron/main.ts',
      },
      rollupOptions: {
        external,
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        setUpMocks: path.resolve(__dirname, 'src', 'mockUtils', 'renderer.ts'),
      },
    },
    plugins: [react()],
    css: {
      modules: {},
    },
    build: {
      sourcemap: true,
      minify: false,
      rollupOptions: {
        external,
      },
    },
  },
  preload: {
    resolve: {
      alias: {
        setUpMocks: path.resolve(__dirname, 'src', 'mockUtils', 'preload.ts'),
      },
    },
    build: {
      lib: {
        entry: 'src/preload/index.ts',
      },
      sourcemap: true,
      minify: false,
      rollupOptions: {
        external,
      },
    },
  },
}

export default config
