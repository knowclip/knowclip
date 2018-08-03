// peak count
const SAMPLE_RATE = 100;

function getPeaks(buffer) {
  const sampleSize = buffer.length / SAMPLE_RATE
  const sampleStep = ~~(sampleSize / 10) || 1
  const { numberOfChannels } = buffer
  const mergedPeaks = []

  for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
    const peaks = []
    const channelData = buffer.getChannelData(channelNumber)

    for (let peakNumber = 0; peakNumber < SAMPLE_RATE; peakNumber++) {
      const start = ~~(peakNumber * sampleSize)
      const end = ~~(start + sampleSize)
      let min = channelData[0]
      let max = channelData[0]

      for (let sampleIndex = start; sampleIndex < end; sampleIndex += sampleStep) {
        const value = channelData[sampleIndex];
        if (value > max) { max = value }
        if (value < min) { min = value }
      }

      peaks[2 * peakNumber] = max
      peaks[2 * peakNumber + 1] = min

      if (channelNumber === 0 || max > mergedPeaks[2 * peakNumber]) {
        mergedPeaks[2 * peakNumber] = max
      }

      if (channelNumber === 0 || min < mergedPeaks[2 * peakNumber + 1]) {
        mergedPeaks[2 * peakNumber + 1] = min
      }
    }
  }

  return mergedPeaks
}

function createAudioContext() {
  if (!window.audioContextInstance) {
      window.AudioContext = window.AudioContext || window.webkitAudioContext

      if (window.AudioContext) {
        window.audioContextInstance = new AudioContext()
      } else {
        alert('Web Audio API is not supported in this browser')
      }
    }

    return window.audioContextInstance
}

function getSvgPath(buffer) {
  const peaks = getPeaks(buffer)
  const totalPeaks = peaks.length
  let d = ''
  for (let peakNumber = 0; peakNumber < totalPeaks; peakNumber++) {
    if (peakNumber % 2 === 0) {
      d += ` M${~~(peakNumber / 2)}, ${peaks.shift()}`
    } else {
      d += ` L${~~(peakNumber / 2)}, ${peaks.shift()}`
    }
  }
  return d;
}

export default function getWaveform(file) {
  return new Promise((resolve, rej) => {
    const context = createAudioContext()
    const fileReader = new FileReader() // do we need two filereaders?
    fileReader.onload = (e) => {
      const arrayBuffer = e.target.result // this.result?
      context.decodeAudioData(arrayBuffer, function(buffer) {
        resolve(getSvgPath(buffer))
      })
    }
    fileReader.readAsArrayBuffer(file)
  })
}
