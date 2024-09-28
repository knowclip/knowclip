import React, { useCallback } from 'react'
import {
  PrimaryClipDisplayProps,
  css,
  msToPixels,
  SELECTION_BORDER_MILLISECONDS,
  PrimaryClip,
} from 'clipwave'
import cn from 'clsx'
import { waveform$ } from './waveformTestLabels'
import { ClipClickDataProps } from 'clipwave/dist/WaveformClips'

export function useWaveformRenderClip() {
  return useCallback(
    ({
      clip,
      isHighlighted,
      height,
      pixelsPerSecond,
      level,
      clickDataProps,
    }: PrimaryClipDisplayProps) => {
      return (
        <WaveformClip
          {...{
            clip,
            level,
            clickDataProps,
            isHighlighted,
            pixelsPerSecond,
            height,
          }}
        />
      )
    },
    []
  )
}

function WaveformClip({
  clip,
  level,
  clickDataProps,
  isHighlighted,
  pixelsPerSecond,
  height,
}: {
  clip: PrimaryClip
  level: number
  clickDataProps: ClipClickDataProps
  isHighlighted: boolean
  pixelsPerSecond: number
  height: number
}) {
  const { id, start, end } = clip
  const y = level * 10
  return (
    <g id={id} {...clickDataProps} className={waveform$.waveformClip}>
      <rect
        className={cn(css.waveformClip, {
          [css.highlightedClip]: isHighlighted,
        })}
        {...getClipRectProps(
          msToPixels(start, pixelsPerSecond),
          msToPixels(end, pixelsPerSecond),
          height
        )}
        y={y}
        style={
          isHighlighted
            ? undefined
            : { fill: `hsl(205, 10%, ${40 + 10 * level}%)` }
        }
        {...clickDataProps}
      />

      <rect
        className={css.waveformClipBorder}
        x={msToPixels(start, pixelsPerSecond)}
        y={0}
        width={msToPixels(SELECTION_BORDER_MILLISECONDS, pixelsPerSecond)}
        height={height}
        {...clickDataProps}
      />
      <rect
        className={cn(css.waveformClipBorder, {
          [css.highlightedClipBorder]: isHighlighted,
        })}
        x={msToPixels(end - SELECTION_BORDER_MILLISECONDS, pixelsPerSecond)}
        y={y}
        width={msToPixels(SELECTION_BORDER_MILLISECONDS, pixelsPerSecond)}
        height={height}
        {...clickDataProps}
      />
    </g>
  )
}

export function getClipRectProps(
  start: number,
  end: number,
  height: number,
  y: number = 0
) {
  return {
    x: Math.min(start, end),
    y,
    width: Math.abs(start - end),
    height,
  }
}
