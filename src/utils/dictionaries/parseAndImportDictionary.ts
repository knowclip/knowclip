import { parseYomichanZip } from './parseYomichanZip'
import { parseCedictZip } from './parseCedictZip'
import { parseDictCCZip } from './parseDictCCZip'

export function parseAndImportDictionary(
  file: DictionaryFile,
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
