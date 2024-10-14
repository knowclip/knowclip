import http from 'http'
import os from 'os'
import Koa from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import { MediaConversionType } from './convertMedia'
import {
  makePostFile,
  makeGetFile,
  makeGetConvertedFilePlaylist,
  makeGetConvertedFileSegment,
} from './routes'

export async function startLocalFileServer() {
  const filePathsRegistry: Record<string, string> = {}

  const server = new Koa()
  const router = new Router()

  router.get('/status', (ctx) => {
    ctx.body = 'ok'
    ctx.status = 200
  })

  router.post('/file/:id', makePostFile(filePathsRegistry))
  router.get('/file/:id', makeGetFile(filePathsRegistry))

  router.get(
    '/file/:id/converted/index.m3u8',
    makeGetConvertedFilePlaylist(filePathsRegistry)
  )
  router.get(
    `/file/:id/converted/${MediaConversionType.TRANSCODE_VIDEO_ONLY}/:segmentNumber.ts`,
    makeGetConvertedFileSegment(
      filePathsRegistry,
      MediaConversionType.TRANSCODE_VIDEO_ONLY
    )
  )
  router.get(
    `/file/:id/converted/${MediaConversionType.TRANSCODE_VIDEO_AND_AUDIO}/:segmentNumber.ts`,
    makeGetConvertedFileSegment(
      filePathsRegistry,
      MediaConversionType.TRANSCODE_VIDEO_AND_AUDIO
    )
  )
  router.get(
    `/file/:id/converted/${MediaConversionType.TRANSCODE_AUDIO_ONLY}/:segmentNumber.ts`,
    makeGetConvertedFileSegment(
      filePathsRegistry,
      MediaConversionType.TRANSCODE_AUDIO_ONLY
    )
  )
  router.get(
    `/file/:id/converted/${MediaConversionType.REMUX}/:segmentNumber.ts`,
    makeGetConvertedFileSegment(filePathsRegistry, MediaConversionType.REMUX)
  )

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
  const localIpAddresses = Object.keys(ifaces)
    .map((ifname) => ifaces[ifname])
    .flat()
    .filter((iface) => iface?.family === 'IPv4' && !iface.internal)
    .map((iface) => iface!.address)

  return localIpAddresses[0]
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
