import moment from 'moment'

export default function formatTime(seconds: number) {
  const minutes = ~~(seconds / 60)
  const secondsRemainder = ~~(seconds % 60)

  return `${minutes}:${String(secondsRemainder).padStart(2, '0')}`
}

export const formatDuration = (duration: moment.Duration) =>
  [
    ~~duration.asHours(),
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

export const formatDurationWithMilliseconds = (duration: moment.Duration) => {
  const milliseconds = Math.round(duration.milliseconds())
  return [
    formatDuration(duration),
    milliseconds
      ? milliseconds
          .toString()
          .padStart(3, '0')
          .replace(/0+$/, '')
      : '0',
  ]
    .filter(v => v)
    .join('.')
}

export const parseFormattedDuration = (formatted: string): number => {
  return moment.duration(formatted).asSeconds()
}
