import { join } from "path";
import { app } from 'electron'

const { isPackaged } = app

export const ROOT_DIRECTORY = join(__dirname, '..', '..')