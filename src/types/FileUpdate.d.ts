type GFileUpdates<FileUpdateNamesEnum extends Record<string, string>> = Record<
  FileUpdateNamesEnum,
  <F>(file: F, ...args: any[]) => F
>

type FileUpdateName = import('../files/FileUpdateName').FileUpdateName

declare type FileUpdatesForFileType<F extends AppFile> = Partial<
  Record<FileUpdateNamesEnum, (file: F, ...args: any[]) => F>
>
type TestFileUpdatesForFileType = FileUpdatesForFileType<MediaFile>

declare type AppFile = Exclude<
  FilesState[keyof FilesState][string],
  null | undefined
>
declare type FileUpdates<F extends AppFile> = GFileUpdates<FileUpdateName, F>

type FileUpdaterOf<U extends FileUpdateName> = FileUpdates[U]

declare type FileUpdate<U extends FileUpdateName> = U extends FileUpdateName
  ? {
      id: FileId
      updateName: U
      fileType: FirstUpdaterParameter<U>['type']
      updatePayload: RestUpdaterParameters<U>
    }
  : never

type FirstUpdaterParameter<U extends FileUpdateName> = Head<
  Parameters<import('../files/updates').AppFileUpdates[U]>
>

type RestUpdaterParameters<U extends FileUpdateName> = Tail<
  Parameters<import('../files/updates').AppFileUpdates[U]>
>

type Tail<T extends any[]> = ((...x: T) => void) extends (
  h: any,
  ...t: infer R
) => void
  ? R
  : never

type Head<T extends any[]> = ((...x: T) => void) extends (
  h: infer A,
  ...t: any[]
) => void
  ? A
  : never
