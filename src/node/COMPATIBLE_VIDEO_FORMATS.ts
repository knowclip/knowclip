/** List from https://www.chromium.org/audio-video/
 * formats from ffmpeg -formats
 */

import { FfprobeData } from 'fluent-ffmpeg'

export const COMPATIBLE_VIDEO_FORMATS = {
  // MP4 (QuickTime/ MOV / ISO-BMFF / CMAF)
  // Ogg
  // WebM
  // WAV
  // HLS [Only on Android and only single-origin manifests]
  mp4: 'MP4 (MPEG-4 Part 14)',
  ogg: 'Ogg',
  webm: 'WebM',
  ['matroska,webm']: 'Matroska / WebM',
  matroska: 'Matroska',
  wav: 'WAV / WAVE (Waveform Audio)',
}
/** List from https://www.chromium.org/audio-video/
 * codecs from ffmpeg -codecs
 */
export const COMPATIBLE_AUDIO_CODECS = {
  // FLAC
  // MP3
  // Opus
  // PCM 8-bit unsigned integer
  // PCM 16-bit signed integer little endian
  // PCM 32-bit float little endian
  // PCM μ-law
  // Vorbis
  // AAC [Main, LC, HE profiles only, xHE-AAC on Android P+, macOS, Windows 11] [Google Chrome only]
  flac: 'FLAC (Free Lossless Audio Codec)',
  mp3: 'MP3 (MPEG audio layer 3)',
  opus: 'Opus',
  pcm_u8: 'PCM unsigned 8-bit',
  pcm_s16le: 'PCM signed 16-bit little-endian',
  pcm_f32le: 'PCM 32-bit float little-endian',
  pcm_mulaw: 'PCM mu-law',
  vorbis: 'Vorbis',
  aac: 'AAC (Advanced Audio Coding)',
}
/** List from https://www.chromium.org/audio-video/
 * codecs from ffmpeg -codecs
 */
export const COMPATIBLE_VIDEO_CODECS = {
  // AV1
  // VP8
  // VP9
  // H.264 [Google Chrome only]
  // H.265 [Google Chrome only and only where supported by the underlying OS]
  av1: 'AV1',
  vp8: 'VP8',
  vp9: 'VP9',
  h264: 'H.264',
  h265: 'H.265',
}

export function getVideoCompatibilityWarnings(metadata: FfprobeData) {
  const warnings: string[] = []
  const fileFormat = metadata.format.format_name
  if (!fileFormat || !(fileFormat.toLowerCase() in COMPATIBLE_VIDEO_FORMATS)) {
    warnings.push(`Video format ${fileFormat} is not compatible`)
  }

  const videoStreams = metadata.streams.filter(
    (stream) => stream.codec_type && /video/i.test(stream.codec_type)
  )
  const audioStreams = metadata.streams.filter(
    (stream) => stream.codec_type && /audio/i.test(stream.codec_type)
  )
  // warn if multiple audio or video streams
  if (videoStreams.length > 1) {
    warnings.push(`Multiple video streams detected`)
  }
  if (audioStreams.length > 1) {
    warnings.push(`Multiple audio streams detected`)
  }

  const incompatibleVideoCodecs = videoStreams.filter((stream) => {
    const codecName = stream.codec_name
    return !(codecName && codecName.toLowerCase() in COMPATIBLE_VIDEO_CODECS)
  })
  if (incompatibleVideoCodecs.length) {
    warnings.push(
      `Incompatible video codecs: ${incompatibleVideoCodecs
        .map((stream) => stream.codec_name)
        .join(', ')}`
    )
  }

  const incompatibleAudioCodecs = audioStreams.filter((stream) => {
    const codecName = stream.codec_name
    return !(codecName && codecName.toLowerCase() in COMPATIBLE_AUDIO_CODECS)
  })
  if (incompatibleAudioCodecs.length) {
    warnings.push(
      `Incompatible audio codecs: ${incompatibleAudioCodecs
        .map((stream) => stream.codec_name)
        .join(', ')}`
    )
  }

  return warnings
}
