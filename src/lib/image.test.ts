import { describe, expect, it } from 'vitest'
import { checkInputFile, fitWithin, ImageError } from './image'

describe('fitWithin', () => {
  it('scales the long edge down to 1568px keeping aspect ratio', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1568, height: 1176 })
    expect(fitWithin(3024, 4032)).toEqual({ width: 1176, height: 1568 })
  })
  it('never upscales', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
  })
})

describe('checkInputFile', () => {
  it('accepts common photo types including iPhone HEIC with no MIME type', () => {
    expect(() => checkInputFile({ type: 'image/jpeg', size: 1e6, name: 'a.jpg' })).not.toThrow()
    expect(() => checkInputFile({ type: '', size: 1e6, name: 'IMG_0001.HEIC' })).not.toThrow()
  })
  it('rejects non-images and huge files', () => {
    expect(() => checkInputFile({ type: 'application/pdf', size: 1e6, name: 'a.pdf' })).toThrow(ImageError)
    expect(() => checkInputFile({ type: 'image/png', size: 40e6, name: 'a.png' })).toThrow(/too large/)
  })
})
