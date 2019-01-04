export default function formatTime(seconds) {
  const minutes = ~~(seconds / 60)
  const secondsRemainder = ~~(seconds % 60)

  return `${minutes}:${String(secondsRemainder).padStart(2, '0')}`
}
