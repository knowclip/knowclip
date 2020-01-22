import uuid from 'uuid/v4'
import moment from 'moment'

const nowUtcTimestamp = () => moment.utc().format()

export default { uuid, nowUtcTimestamp }
