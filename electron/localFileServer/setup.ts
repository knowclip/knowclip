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
import { findFreePort } from './findFreePort'

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

  const port = await findFreePort(3000)
  const knowclipServerIp = getLocalIpAddress()
  const knowclipServerAddress = `http://${knowclipServerIp}:${port}`

  server.listen(port, () => {
    console.log(`Serving at ${knowclipServerAddress}`)
  })

  const status = await statusCheck(`${knowclipServerAddress}/status`)
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
