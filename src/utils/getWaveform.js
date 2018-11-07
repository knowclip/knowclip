// peak count
// const SAMPLE_RATE = 1000
const SAMPLE_STEP = 1
export function getPeaks(buffer, stepsPerSecond) {
  const SAMPLE_RATE = stepsPerSecond * buffer.duration
  // what unit is buffer.length?
  const sampleSize = buffer.length / SAMPLE_RATE
  // const sampleStep = ~~(sampleSize / 10) || 1
  const { numberOfChannels } = buffer
  const mergedPeaks = []
  console.log('buffer')
  console.log(buffer)
  console.log('numberOfChannels')
  console.log(numberOfChannels)
  console.log('sampleSize')
  console.log(sampleSize)
  console.log('SAMPLE_STEP')
  console.log(SAMPLE_STEP)

  for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
    const channelData = buffer.getChannelData(channelNumber)
    const totalPeaks = buffer.duration * stepsPerSecond

    // for (let peakNumber = 0; peakNumber < SAMPLE_RATE; peakNumber++) {
    for (let peakNumber = 0; peakNumber < totalPeaks; peakNumber++) {
      const start = ~~(peakNumber * sampleSize)
      const end = ~~(start + sampleSize)
      // what unit is min/max from the channelData?
      let min = channelData[0]
      let max = channelData[0]

      for (let sampleIndex = start; sampleIndex < end; sampleIndex += SAMPLE_STEP) {
        const value = channelData[sampleIndex];
        if (value > max) { max = value }
        if (value < min) { min = value }
      }

      // if (channelNumber === 0) {
      if (channelNumber === 0 || max > mergedPeaks[2 * peakNumber]) {
        mergedPeaks[2 * peakNumber] = max
      }

      // if (channelNumber === 0) {
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

function toArrayBuffer(buf) {
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}

export default function decodeAudioData(file) {
  return new Promise((resolve, rej) => {
    const context = createAudioContext()
    // const fileReader = new FileReader() // do we need two filereaders?
    // fileReader.onload = (e) => {
    //   const audioDataArrayBuffer = e.target.result // this.result?
    //   context.decodeAudioData(audioDataArrayBuffer, function(buffer) {
    //     resolve({ buffer })
    //   })
    // }
    // fileReader.readAsArrayBuffer(file)

    const arrayBuffer = toArrayBuffer(file)
    context.decodeAudioData(arrayBuffer, function(buffer) {
      resolve({ buffer })
    })
  })
}
