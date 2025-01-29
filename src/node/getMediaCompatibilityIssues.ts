/** List from https://www.chromium.org/audio-video/
 * formats from ffmpeg -formats
 */

import { FfprobeData } from 'fluent-ffmpeg'

export const COMPATIBLE_VIDEO_FORMATS = {
  mp4: 'MP4 (MPEG-4 Part 14)',
  ogg: 'Ogg',
  webm: 'WebM',
  'matroska,webm': 'Matroska / WebM',
  matroska: 'Matroska',
  wav: 'WAV / WAVE (Waveform Audio)',
  'mov,mp4,m4a,3gp,3g2,mj2': 'Mov',
}
/** List from https://www.chromium.org/audio-video/
 * codecs from ffmpeg -codecs
 */
export const COMPATIBLE_AUDIO_CODECS = {
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
  av1: 'AV1',
  vp8: 'VP8',
  vp9: 'VP9',
  h264: 'H.264',
  // h265: 'H.265', "[Google Chrome only and only where supported by the underlying OS]" https://www.chromium.org/audio-video/
}

export type CompatibleVideoCodec = keyof typeof COMPATIBLE_VIDEO_CODECS
export type CompatibleAudioCodec = keyof typeof COMPATIBLE_AUDIO_CODECS

type MediaCodec = CompatibleVideoCodec | CompatibleAudioCodec

export const getAudioEncoder = (codec: MediaCodec) => {
  switch (codec) {
    case 'mp3':
      return 'libmp3lame'
    case 'opus':
      return 'libopus' // also 'opus'
    case 'pcm_mulaw':
      return 'pcm_mulaw' // also 'pcm_mulaw_at'
    case 'vorbis':
      return 'libvorbis' // also 'vorbis'
    case 'aac':
      return 'aac' // also 'aac_at'
    default:
      return codec
  }
}

export const getVideoEncoder = (codec: MediaCodec) => {
  switch (codec) {
    case 'av1':
      return 'libaom-av1' // also 'librav1e' 'libsvtav1'
    case 'vp8':
      return 'libvpx'
    case 'vp9':
      return 'libvpx-vp9'
    case 'h264':
      return 'libx264' // also 'libx264rgb' 'h264_videotoolbox'
    default:
      return codec
  }
}

export const getHlsCompatibleVideoCodec = (
  codec: CompatibleVideoCodec
): CompatibleVideoCodec => {
  if (codec === 'vp8') return 'h264'
  return codec
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
      `Incompatible video codec${
        incompatibleVideoCodecs.length > 1 ? 's' : ''
      }: ${incompatibleVideoCodecs
        .map((stream) => stream.codec_name)
        .join(', ')}`
    )
  }
  if (issues.has(MediaCompatibilityIssue.INCOMPATIBLE_AUDIO_CODEC)) {
    warnings.push(
      `Incompatible audio codec${
        incompatibleVideoCodecs.length > 1 ? 's' : ''
      }: ${incompatibleAudioCodecs
        .map((stream) => stream.codec_name)
        .join(', ')}`
    )
  }

  return warnings
}
