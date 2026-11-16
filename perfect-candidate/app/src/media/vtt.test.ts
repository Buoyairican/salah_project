import { describe, expect, it } from 'vitest'
import { cueAt, parseVtt } from './vtt'

describe('parseVtt', () => {
  it('reads WebVTT cues with ids, settings, tags and multi-line text', () => {
    const cues = parseVtt(
      'WEBVTT\n\nNOTE hello\n\n1\n00:00:00.470 --> 00:00:03.975 line:80%\n<v Ana>When a jury</v>\nmember cuts you off.\n\n2\n00:00:04.015 --> 00:00:08.551\n<i>Stay calm.</i>\n',
    )
    expect(cues).toEqual([
      { start: 0.47, end: 3.975, text: 'When a jury member cuts you off.' },
      { start: 4.015, end: 8.551, text: 'Stay calm.' },
    ])
  })
  it('reads SRT, with hours, commas and CRLF, and skips broken cues', () => {
    const cues = parseVtt('1\r\n01:00:02,5 --> 01:00:04,000\r\nHi\r\n\r\n2\r\n00:00:09,000 --> 00:00:08,000\r\nBad\r\n')
    expect(cues).toEqual([{ start: 3602.5, end: 3604, text: 'Hi' }])
  })
  it('finds the cue on screen at a time', () => {
    const cues = parseVtt('WEBVTT\n\n00:01.000 --> 00:02.000\nA\n\n00:03.000 --> 00:04.000\nB\n')
    expect(cueAt(cues, 0.5)).toBeNull()
    expect(cueAt(cues, 1.5)?.text).toBe('A')
    expect(cueAt(cues, 2.5)).toBeNull()
    expect(cueAt(cues, 3.999)?.text).toBe('B')
    expect(cueAt(cues, 9)).toBeNull()
  })
})
