declare module 'subsrt' {
  type Chunk = { type: string; start: number; end: number; text: string }
  export function parse(fileContents: string): Array<Chunk>
}
