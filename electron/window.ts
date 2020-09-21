import * as url from 'url'
import * as path from 'path'
import { ROOT_DIRECTORY } from './root';

export const WINDOW_START_DIMENSIONS = {
  width: 1027,
  height: 768,
}

export function getStartUrl(startUrl?: string) {
  return startUrl || url.format({
    pathname: path.join(ROOT_DIRECTORY, 'build', 'index.html'),
    protocol: 'file:',
    slashes: true,
  });
}