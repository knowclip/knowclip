import uuid from 'uuid/v4'
import moment from 'moment'

const nowUtcTimestamp = () => moment.utc().format()

const sideEffectsHelpers = { uuid, nowUtcTimestamp }

export default sideEffectsHelpers
