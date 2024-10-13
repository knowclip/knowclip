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
  'mov,mp4,m4a,3gp,3g2,mj2': 'Mov',
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

export enum MediaCompatibilityIssue {
  INCOMPATIBLE_FORMAT,
  MULTIPLE_VIDEO_STREAMS,
  MULTIPLE_AUDIO_STREAMS,
  INCOMPATIBLE_VIDEO_CODEC,
  INCOMPATIBLE_AUDIO_CODEC,
}

export function getMediaCompatibilityIssues(metadata: FfprobeData) {
  const issues = new Set<MediaCompatibilityIssue>()
  const fileFormat = metadata.format.format_name?.toLowerCase()
  if (
    !fileFormat ||
    (!(fileFormat in COMPATIBLE_VIDEO_FORMATS) &&
      !(fileFormat in COMPATIBLE_AUDIO_CODECS))
  ) {
    issues.add(MediaCompatibilityIssue.INCOMPATIBLE_FORMAT)
  }

  const videoStreams = metadata.streams.filter(
    (stream) => stream.codec_type && /video/i.test(stream.codec_type)
  )
  const audioStreams = metadata.streams.filter(
    (stream) => stream.codec_type && /audio/i.test(stream.codec_type)
  )
  // warn if multiple audio or video streams
  if (videoStreams.length > 1) {
    issues.add(MediaCompatibilityIssue.MULTIPLE_VIDEO_STREAMS)
  }
  if (audioStreams.length > 1) {
    issues.add(MediaCompatibilityIssue.MULTIPLE_AUDIO_STREAMS)
  }

  const incompatibleVideoCodecs = videoStreams.filter((stream) => {
    const codecName = stream.codec_name
    return !(codecName && codecName.toLowerCase() in COMPATIBLE_VIDEO_CODECS)
  })
  if (incompatibleVideoCodecs.length) {
    issues.add(MediaCompatibilityIssue.INCOMPATIBLE_VIDEO_CODEC)
  }

  const incompatibleAudioCodecs = audioStreams.filter((stream) => {
    const codecName = stream.codec_name
    return !(codecName && codecName.toLowerCase() in COMPATIBLE_AUDIO_CODECS)
  })
  if (incompatibleAudioCodecs.length) {
    issues.add(MediaCompatibilityIssue.INCOMPATIBLE_AUDIO_CODEC)
  }

  return { issues, incompatibleVideoCodecs, incompatibleAudioCodecs }
}

export function getMediaCompatibilityWarnings(metadata: FfprobeData) {
  const { issues, incompatibleAudioCodecs, incompatibleVideoCodecs } =
    getMediaCompatibilityIssues(metadata)
  const warnings: string[] = []
  if (issues.has(MediaCompatibilityIssue.INCOMPATIBLE_FORMAT)) {
    warnings.push(
      `Media format ${
        metadata.format.format_name?.toLowerCase() || 'UKNOWN'
      } is not compatible`
    )
  }
  if (issues.has(MediaCompatibilityIssue.MULTIPLE_VIDEO_STREAMS)) {
    warnings.push(`Multiple video streams detected`)
  }
  if (issues.has(MediaCompatibilityIssue.MULTIPLE_AUDIO_STREAMS)) {
    warnings.push(`Multiple audio streams detected`)
  }
  if (issues.has(MediaCompatibilityIssue.INCOMPATIBLE_VIDEO_CODEC)) {
    warnings.push(
      `Incompatible video codec(s): ${incompatibleVideoCodecs
        .map((stream) => stream.codec_name)
        .join(', ')}`
    )
  }
  if (issues.has(MediaCompatibilityIssue.INCOMPATIBLE_AUDIO_CODEC)) {
    warnings.push(
      `Incompatible audio codec(s): ${incompatibleAudioCodecs
        .map((stream) => stream.codec_name)
        .join(', ')}`
    )
  }

  return warnings
}
