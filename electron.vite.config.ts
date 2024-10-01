import { UserConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const external = ['better-sqlite3', 'archiver']
const config: UserConfig = {
  main: {
    build: {
      watch: null,
      lib: {
        entry: 'electron/main.ts',
      },
      rollupOptions: {
        external,
        output: {
          // file: 'main.js',
          dir: 'out/main',
        },
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
      rollupOptions: {
        external,
      },
    },
    server: {
      hmr: false, // Ensure HMR is off
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
