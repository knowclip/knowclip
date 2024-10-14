import { failure } from '../../src/utils/result'
import { ffmpeg, getMediaMetadata } from '../../src/node/ffmpeg'
import { MediaCompatibilityIssue } from '../../src/node/getMediaCompatibilityIssues'

export enum MediaConversionType {
  TRANSCODE_VIDEO_ONLY = 'v',
  TRANSCODE_AUDIO_ONLY = 'a',
  TRANSCODE_VIDEO_AND_AUDIO = 'va',
  REMUX = 'x',
}

export function getConversionTypeCode(
  compatibilityIssues: Set<MediaCompatibilityIssue>
) {
  if (
    compatibilityIssues.has(MediaCompatibilityIssue.INCOMPATIBLE_AUDIO_CODEC) &&
    compatibilityIssues.has(MediaCompatibilityIssue.INCOMPATIBLE_VIDEO_CODEC)
  ) {
    return MediaConversionType.TRANSCODE_VIDEO_AND_AUDIO
  } else if (
    compatibilityIssues.has(MediaCompatibilityIssue.INCOMPATIBLE_AUDIO_CODEC)
  ) {
    return MediaConversionType.TRANSCODE_AUDIO_ONLY
  } else if (
    compatibilityIssues.has(MediaCompatibilityIssue.INCOMPATIBLE_VIDEO_CODEC)
  ) {
    return MediaConversionType.TRANSCODE_VIDEO_ONLY
  } else {
    return MediaConversionType.REMUX
  }
}

export async function convertMedia(
  filePath: string,
  segmentDurationSeconds: number,
  segmentNumber: number,
  conversionType: MediaConversionType
): AsyncResult<ffmpeg.FfmpegCommand> {
  const metadataResult = await getMediaMetadata(filePath)

  if (metadataResult.error) {
    return metadataResult
  }

  const isVideo = metadataResult.value.streams.some(
    (stream) => stream.codec_type === 'video'
  )

  try {
    return {
      value: isVideo
        ? await convertVideo(
            filePath,
            segmentDurationSeconds,
            segmentNumber,
            conversionType
          )
        : await convertAudio(
            filePath,
            segmentDurationSeconds,
            segmentNumber,
            conversionType
          ),
    }
  } catch (error) {
    return failure(error)
  }
}

export async function convertVideo(
  filePath: string,
  segmentDurationSeconds: number,
  segmentNumber: number,
  conversionType: MediaConversionType
) {
  const segmentStartSeconds = segmentNumber * segmentDurationSeconds

  return ffmpeg(filePath)
    .withVideoCodec(
      conversionType === MediaConversionType.TRANSCODE_VIDEO_ONLY ||
        conversionType === MediaConversionType.TRANSCODE_VIDEO_AND_AUDIO
        ? 'libx264'
        : 'copy'
    )
    .withAudioCodec(
      conversionType === MediaConversionType.TRANSCODE_AUDIO_ONLY ||
        conversionType === MediaConversionType.TRANSCODE_VIDEO_AND_AUDIO
        ? 'aac'
        : 'copy'
    )
    .inputOptions([
      '-copyts', // Fixes timestamp issues (Keep timestamps as original file)
      '-threads 8',
      `-ss ${segmentStartSeconds}`,
      '-t ' + segmentDurationSeconds,
    ])
    .outputOptions([
      '-copyts', // Fixes timestamp issues (Keep timestamps as original file)
      '-pix_fmt yuv420p',
      '-map 0',
      '-map -v',
      '-map 0:V',
      '-map 0:s?',
      '-g 52',
      // `-crf ${this.CRF_SETTING}`,
      '-sn',
      '-deadline realtime',
      '-preset:v ultrafast',
      '-f hls',
      `-hls_time ${segmentDurationSeconds}`,
      '-force_key_frames expr:gte(t,n_forced*2)',
      '-hls_playlist_type vod',
      `-start_number ${segmentNumber}`,
      '-strict -2',
      '-level 4.1', // Fixes chromecast issues
      '-ac 2', // Set two audio channels. Fixes audio issues for chromecast
      // '-b:v 1024k',
      '-b:a 192k',
      '-loglevel error',
    ])
}

export async function convertAudio(
  audioPath: string,
  segmentDurationSeconds: number,
  segmentNumber: number,
  conversionType: MediaConversionType
) {
  const segmentStartSeconds = segmentNumber * segmentDurationSeconds
  return ffmpeg(audioPath)
    .withAudioCodec(
      conversionType === MediaConversionType.REMUX ? 'copy' : 'aac'
    )
    .inputOptions([
      '-copyts', // Fixes timestamp issues (Keep timestamps as original file)
      '-threads 8',
      `-ss ${segmentStartSeconds}`,
      '-t ' + segmentDurationSeconds,
    ])
    .outputOptions([
      '-copyts', // Fixes timestamp issues (Keep timestamps as original file)
      '-pix_fmt yuv420p',
      '-map 0',
      '-map -v',
      // '-map 0:V',
      '-map 0:s?',
      '-g 52',
      // `-crf ${this.CRF_SETTING}`,
      '-sn',
      '-deadline realtime',
      '-preset:v ultrafast',
      '-f hls',
      `-hls_time ${segmentDurationSeconds}`,
      '-force_key_frames expr:gte(t,n_forced*2)',
      '-hls_playlist_type vod',
      `-start_number ${segmentNumber}`,
      '-strict -2',
      '-level 4.1', // Fixes chromecast issues
      '-ac 2', // Set two audio channels. Fixes audio issues for chromecast
      // '-b:v 1024k',
      '-b:a 192k',
      '-loglevel error',
    ])
}
