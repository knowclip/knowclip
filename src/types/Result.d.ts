type Result<T, E = Error> = Failure<E> | Success<T>
type Failure<E = Error> = { error: E; value?: undefined }
type Success<T> = { value: T; error?: undefined }

type AsyncResult<T, E = Error> = Promise<Result<T, E>>
