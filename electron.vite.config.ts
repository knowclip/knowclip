import { UserConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

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
        external: ['better-sqlite3', 'archiver'],
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        setUpMocks: path.resolve(__dirname, 'src', 'mockUtils', 'renderer.ts'),
      },
    },
    plugins: [
      {
        name: 'replace-yomitan-css-urls',
        enforce: 'pre',
        transform(css, id) {
          if (id.endsWith('.css') && /vendor\/yomitan\//.test(id)) {
            return css.replace(/(url\('?)(\/images)/g, '$1..$2')
          }
          return null
        },
      },
      react(),
    ],
    css: {
      modules: {},
    },
    build: {
      sourcemap: true,
      minify: false,
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
    },
  },
}

export default config
