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
            return (
              css
                // replace all image URLs with relative paths based on folder structure
                // to conform with react plugin's way of handling assets
                .replace(/(url\('?)(\/images)/g, '$1..$2')
                // scope all selectors under .yomitan-popover
                .replace(
                  /(^|\n)([a-zA-Z.[][.a-zA-Z0-9_\- [\]=>:]*)(,\n| \{\n)/g,
                  '$1.yomitan-popover $2$3'
                )
                // replace all :root selectors with .yomitan-popover
                .replace(/(:root(\[[^\]]+\])?)/g, '$1 .yomitan-popover')
            )
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
