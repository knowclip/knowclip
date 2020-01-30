import moment from 'moment'

export default function formatTime(seconds: number) {
  const minutes = ~~(seconds / 60)
  const secondsRemainder = ~~(seconds % 60)

  return `${minutes}:${String(secondsRemainder).padStart(2, '0')}`
}

/** must be less than 24 hours */
export const formatDuration = (duration: moment.Duration) =>
  [
    duration.hours(),
    duration
      .minutes()
      .toString()
      .padStart(2, '0'),
    duration
      .seconds()
      .toString()
      .padStart(2, '0'),
  ]
    .filter(v => v)
    .join(':')
