import { failure } from '../../src/utils/result'
import { ffmpeg, getMediaMetadata } from '../../src/node/ffmpeg'
import {
  CompatibleVideoCodec,
  getHlsCompatibleVideoCodec,
  getVideoEncoder,
  MediaCompatibilityIssue,
} from '../../src/node/getMediaCompatibilityIssues'

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

const metadataCache = new Map<string, ffmpeg.FfprobeData>()
async function getMediaMetadataMemoized(
  filePath: string
): AsyncResult<ffmpeg.FfprobeData> {
  if (metadataCache.has(filePath)) {
    return { value: metadataCache.get(filePath)! }
  }
  const metadata = await getMediaMetadata(filePath)

  if (metadata.error) {
    return metadata
  }
  metadataCache.set(filePath, metadata.value)
  return metadata
}

export async function convertMedia(
  filePath: string,
  segmentDurationSeconds: number,
  segmentNumber: number,
  conversionType: MediaConversionType
): AsyncResult<ffmpeg.FfmpegCommand> {
  const metadataResult = await getMediaMetadataMemoized(filePath)

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
            metadataResult.value,
            segmentDurationSeconds,
            segmentNumber,
            conversionType
          )
        : await convertAudio(filePath, segmentDurationSeconds, segmentNumber),
    }
  } catch (error) {
    return failure(error)
  }
}

export async function convertVideo(
  filePath: string,
  metadata: ffmpeg.FfprobeData,
  segmentDurationSeconds: number,
  segmentNumber: number,
  conversionType: MediaConversionType
) {
  const segmentStartSeconds = segmentNumber * segmentDurationSeconds

  const originalVideoCodecs = new Set(
    metadata.streams
      .filter((stream) => stream.codec_type === 'video')
      .flatMap((stream) => (stream.codec_name ? [stream.codec_name] : []))
  )
  const videoCopyModeCode =
    originalVideoCodecs.size === 1 ? [...originalVideoCodecs][0] : 'libx264'

  const videoWidth = Math.max(
    ...metadata.streams.map((stream) =>
      stream.codec_type === 'video' ? stream.width ?? 0 : 0
    )
  )
  const videoHeight = Math.max(
    ...metadata.streams.map((stream) =>
      stream.codec_type === 'video' ? stream.height ?? 0 : 0
    )
  )
  const videoBitRate = getVideoBitrate(videoWidth, videoHeight)

  return ffmpeg(filePath)
    .withVideoCodec(
      getVideoEncoder(
        getHlsCompatibleVideoCodec(
          conversionType === MediaConversionType.TRANSCODE_VIDEO_ONLY ||
            conversionType === MediaConversionType.TRANSCODE_VIDEO_AND_AUDIO
            ? 'h264'
            : (videoCopyModeCode as CompatibleVideoCodec)
        )
      )
    )
    .withAudioCodec(
      // hls supports limited audio codecs
      'aac'
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
      '-map 0', // Map all streams from input index 0
      '-map -v', // Exclude video stream
      '-map 0:V', // Maps the main video stream
      // '-map -a', // Exclude audio stream
      // '-map 0:a:0', // Use the first audio stream
      '-map 0:s?', // Include subtitles if they exist
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
      // `-b:v ${getVideoBitrate(videoWidth, videoHeight)}k`,
      `-b:v ${videoBitRate}k`,
      '-b:a 192k',
      '-loglevel error',
    ])
}

export async function convertAudio(
  audioPath: string,
  segmentDurationSeconds: number,
  segmentNumber: number
) {
  const segmentStartSeconds = segmentNumber * segmentDurationSeconds

  return ffmpeg(audioPath)
    .withAudioCodec(
      // hls supports limited audio codecs
      'aac'
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

function getVideoBitrate(width: number, height: number) {
  return Math.round((width * height * 30 * 0.2) / 1000)
}
