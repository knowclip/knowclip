import { UserConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const external = ['better-sqlite3', 'archiver']
const config: UserConfig = {
  main: {
    // resolve: {
    //   alias: {
    //     // should not be here.
    //     preloaded: path.resolve(__dirname, 'src', 'preloaded'),
    //   },
    // },
    build: {
      lib: {
        entry: 'electron/main.ts',
      },
      sourcemap: true,
      minify: false,
      rollupOptions: {
        external,
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        preloaded: path.resolve(__dirname, 'src', 'preloaded'),
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
