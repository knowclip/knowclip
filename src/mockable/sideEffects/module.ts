import { v4 as uuid } from 'uuid'
import moment from 'moment'

const nowUtcTimestamp = () => moment.utc().format()

const sideEffectsHelpers = { uuid, nowUtcTimestamp }

export default sideEffectsHelpers
