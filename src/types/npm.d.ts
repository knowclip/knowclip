declare module '@silvestre/subsrt' {
  type Chunk = { type: string; start: number; end: number; text: string }
  export function parse(fileContents: string): Array<Chunk>
}

declare module 'anki-apkg-export-multi-field/dist/template' {
  export default function createTemplate(template: ApkgExportTemplate)
}
declare module 'anki-apkg-export-multi-field/dist/exporter' {
  export default class Exporter {
    constructor(deckName: string, options: object)
    addMedia(fileName: string, buffer: Buffer)
    addCard(fields: string[], restSpecs: { tags: string[]; due: number })
    save(options: {
      type: string
      base64: boolean
      compression: string
    }): Promise<Buffer>
  }
}
