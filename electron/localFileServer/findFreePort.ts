import * as net from 'net'

export function findFreePort(startPort: number) {
  let port = startPort
  return new Promise<number>((resolve) => {
    const server = net.createServer()
    server.on('error', () => {
      port++
      server.listen(port)
    })
    server.on('listening', () => {
      server.close()
      resolve(port)
    })
    server.listen(port)
  })
}
