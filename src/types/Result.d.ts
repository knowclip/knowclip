type Result<T> = Failure | Success<T>
type Failure = { errors: string[]; value?: undefined }
type Success<T> = { value: T; errors?: undefined }

type AsyncResult<T> = Promise<Result<T>>
