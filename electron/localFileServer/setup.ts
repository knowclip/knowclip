import http from 'http'
import os from 'os'
import Koa from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import fs from 'fs'
import path from 'path'
import { MediaConversionType } from './convertMedia'
import {
  makeGetFile,
  makeGetConvertedFilePlaylist,
  makeGetConvertedFileSegment,
} from './routes'
import { Conf } from 'electron-conf/main'
import { ROOT_DIRECTORY } from '../root'
import serve from 'koa-static'

// the file ids should probably just be the same as in project files/redux store.

export async function startLocalFileServer(conf: Conf) {
  const filePathsRegistry: Record<string, string> = {}

  const server = new Koa()
  const router = new Router()

  router.get('/status', (ctx) => {
    ctx.body = 'ok'
    ctx.status = 200
  })

  // router.get('/persisted-state', (ctx) => {

  console.log('--- Persisted state ---')
  console.log('persist:files', JSON.parse(conf.get('persist:files') as string))
  console.log('persist:root', JSON.parse(conf.get('persist:root') as string))

  const accessControlAllowOrigin = 'http://192.168.50.82:3000'
  router.get(
    '/file/:id.:ext',
    makeGetFile(
      filePathsRegistry,
      // for testing
      accessControlAllowOrigin
    )
  )

  router.get(
    '/file/:id/converted/index.m3u8',
    makeGetConvertedFilePlaylist(filePathsRegistry, accessControlAllowOrigin)
  )
  router.get(
    `/file/:id/converted/${MediaConversionType.TRANSCODE_VIDEO_ONLY}/:segmentNumber.ts`,
    makeGetConvertedFileSegment(
      filePathsRegistry,
      MediaConversionType.TRANSCODE_VIDEO_ONLY,
      accessControlAllowOrigin
    )
  )
  router.get(
    `/file/:id/converted/${MediaConversionType.TRANSCODE_VIDEO_AND_AUDIO}/:segmentNumber.ts`,
    makeGetConvertedFileSegment(
      filePathsRegistry,
      MediaConversionType.TRANSCODE_VIDEO_AND_AUDIO,
      accessControlAllowOrigin
    )
  )
  router.get(
    `/file/:id/converted/${MediaConversionType.TRANSCODE_AUDIO_ONLY}/:segmentNumber.ts`,
    makeGetConvertedFileSegment(
      filePathsRegistry,
      MediaConversionType.TRANSCODE_AUDIO_ONLY,
      accessControlAllowOrigin
    )
  )
  router.get(
    `/file/:id/converted/${MediaConversionType.REMUX}/:segmentNumber.ts`,
    makeGetConvertedFileSegment(
      filePathsRegistry,
      MediaConversionType.REMUX,
      accessControlAllowOrigin
    )
  )

  console.log(
    'Serving static files from:',
    path.join(ROOT_DIRECTORY, 'knowclip-web', 'out')
  )
  server.use(serve(path.join(ROOT_DIRECTORY, 'knowclip-web', 'out')))

  server.on('error', (error, ctx) => {
    if (
      (error.code === 'EPIPE' || error.code === 'ECONNRESET') &&
      ctx.request.url.startsWith('/file/')
    ) {
      // connection closed by client
    } else {
      console.error('Koa app-level error', { error })
    }
  })
  server.use(bodyParser())
  server.use(router.routes())
  server.use(router.allowedMethods())

  const knowclipServerIp = getLocalIpAddress()
  const knowclipServerAddress = (port: number) =>
    `http://${knowclipServerIp}:${port}`

  const port = await startServerAtAvailablePort(server, 3000)

  const status = await statusCheck(`${knowclipServerAddress(port)}/status`)
  if (status === 200) {
    console.log('Server is up')
  } else {
    console.error('Server is down', status)
  }

  return {
    knowclipServerIp,
    knowclipServerPort: port,
    filePathsRegistry,
  }
}

async function statusCheck(url: string) {
  return new Promise<number | undefined>((resolve, reject) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode)
    })
    req.on('error', reject)
  })
}

function getLocalIpAddress() {
  const ifaces = os.networkInterfaces()
  const localIpAddresses = Object.values(ifaces).flatMap(
    (ifaces) =>
      ifaces?.filter((iface) => iface?.family === 'IPv4' && !iface.internal) ||
      []
  )

  return localIpAddresses[0].address
}

function startServer(app: Koa, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`)
      resolve(port)
    })

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} is in use, trying next port...`)
        server.close() // Ensure we close the server before retrying
        reject(err)
      } else {
        console.error('Unexpected error occurred:', err)
        reject(err)
      }
    })
  })
}

async function startServerAtAvailablePort(app: Koa, startingPort: number) {
  let currentPort = startingPort

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await startServer(app, currentPort)
      break // Exit loop once the server starts successfully
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
        currentPort++
      } else {
        throw err // Re-throw other errors
      }
    }
  }
}
