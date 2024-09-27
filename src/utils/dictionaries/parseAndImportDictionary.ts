import { parseYomichanZip } from './parseYomichanZip'
import { parseCedictZip } from './parseCedictZip'
import { parseDictCCZip } from './parseDictCCZip'

export function parseDictionary<T extends DictionaryFile>(
  file: T,
  filePath: string
) {
  switch (file.dictionaryType) {
    case 'YomichanDictionary':
      return parseYomichanZip(file, filePath)
    case 'CEDictDictionary':
      return parseCedictZip(file, filePath)
    case 'DictCCDictionary':
      return parseDictCCZip(file, filePath)
  }
}
