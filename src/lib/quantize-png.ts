import {inflateSync, deflateSync} from 'node:zlib'
import {paletteRgb, type ColorModeId} from './display'

function paeth(a: number, b: number, c: number) {
	const p = a + b - c
	const pa = Math.abs(p - a)
	const pb = Math.abs(p - b)
	const pc = Math.abs(p - c)
	if (pa <= pb && pa <= pc) return a
	if (pb <= pc) return b
	return c
}

function readChunk(buffer: Buffer, offset: number) {
	const length = buffer.readUInt32BE(offset)
	const type = buffer.subarray(offset + 4, offset + 8).toString('ascii')
	const data = buffer.subarray(offset + 8, offset + 8 + length)
	return {length, type, data, next: offset + 12 + length}
}

function decodePng(buffer: Buffer) {
	if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Not a PNG')
	let offset = 8
	let width = 0
	let height = 0
	let bitDepth = 8
	let colorType = 6
	const idat: Buffer[] = []
	while (offset < buffer.length) {
		const chunk = readChunk(buffer, offset)
		if (chunk.type === 'IHDR') {
			width = chunk.data.readUInt32BE(0)
			height = chunk.data.readUInt32BE(4)
			bitDepth = chunk.data[8]
			colorType = chunk.data[9]
		}
		if (chunk.type === 'IDAT') idat.push(chunk.data)
		if (chunk.type === 'IEND') break
		offset = chunk.next
	}
	if (!width || !height || bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) throw new Error('Unsupported PNG')
	const channels = colorType === 6 ? 4 : 3
	const inflated = inflateSync(Buffer.concat(idat))
	const stride = width * channels
	const pixels = Buffer.alloc(width * height * 4)
	let src = 0
	let prev = Buffer.alloc(stride)
	for (let y = 0; y < height; y++) {
		const filter = inflated[src++]
		const row = inflated.subarray(src, src + stride)
		src += stride
		const recon = Buffer.alloc(stride)
		for (let i = 0; i < stride; i++) {
			const left = i >= channels ? recon[i - channels] : 0
			const up = prev[i]
			const upLeft = i >= channels ? prev[i - channels] : 0
			const raw = row[i]
			if (filter === 0) recon[i] = raw
			else if (filter === 1) recon[i] = (raw + left) & 255
			else if (filter === 2) recon[i] = (raw + up) & 255
			else if (filter === 3) recon[i] = (raw + ((left + up) >> 1)) & 255
			else if (filter === 4) recon[i] = (raw + paeth(left, up, upLeft)) & 255
			else throw new Error('Unknown PNG filter')
		}
		for (let x = 0; x < width; x++) {
			const i = x * channels
			const o = (y * width + x) * 4
			pixels[o] = recon[i]
			pixels[o + 1] = recon[i + 1]
			pixels[o + 2] = recon[i + 2]
			pixels[o + 3] = channels === 4 ? recon[i + 3] : 255
		}
		prev = recon
	}
	return {width, height, pixels}
}

function crc32(data: Buffer) {
	let crc = 0xffffffff
	for (const byte of data) {
		crc ^= byte
		for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
	}
	return (crc ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Buffer) {
	const body = Buffer.concat([Buffer.from(type), data])
	const out = Buffer.alloc(12 + data.length)
	out.writeUInt32BE(data.length, 0)
	body.copy(out, 4)
	out.writeUInt32BE(crc32(body), 8 + data.length)
	return out
}

function pngFile(width: number, height: number, bitDepth: number, colorType: number, extra: Buffer[], raw: Buffer) {
	const ihdr = Buffer.alloc(13)
	ihdr.writeUInt32BE(width, 0)
	ihdr.writeUInt32BE(height, 4)
	ihdr[8] = bitDepth
	ihdr[9] = colorType
	return Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		chunk('IHDR', ihdr),
		...extra,
		chunk('IDAT', deflateSync(raw, {level: 9})),
		chunk('IEND', Buffer.alloc(0)),
	])
}

function packBits(width: number, height: number, bitDepth: 1 | 2 | 4 | 8, sample: (x: number, y: number) => number) {
	const pixelsPerByte = 8 / bitDepth
	const rowBytes = Math.ceil(width / pixelsPerByte)
	const raw = Buffer.alloc((rowBytes + 1) * height)
	for (let y = 0; y < height; y++) {
		const rowStart = y * (rowBytes + 1)
		raw[rowStart] = 0
		for (let x = 0; x < width; x++) {
			const value = sample(x, y) & ((1 << bitDepth) - 1)
			const bitPos = (x % pixelsPerByte) * bitDepth
			raw[rowStart + 1 + Math.floor(x / pixelsPerByte)] |= value << (8 - bitDepth - bitPos)
		}
	}
	return raw
}

function luminance(pixels: Buffer, i: number) {
	return 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]
}

function ditherToBlackWhite(pixels: Buffer, width: number, height: number) {
	const errors = new Float32Array(width * height)
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4
			const old = Math.min(255, Math.max(0, luminance(pixels, i) + errors[y * width + x]))
			const next = old < 160 ? 0 : 255
			const err = old - next
			pixels[i] = next
			pixels[i + 1] = next
			pixels[i + 2] = next
			pixels[i + 3] = 255
			if (x + 1 < width) errors[y * width + x + 1] += (err * 7) / 16
			if (y + 1 < height) {
				if (x > 0) errors[(y + 1) * width + x - 1] += (err * 3) / 16
				errors[(y + 1) * width + x] += (err * 5) / 16
				if (x + 1 < width) errors[(y + 1) * width + x + 1] += err / 16
			}
		}
	}
}

function encodeGray1(width: number, height: number, pixels: Buffer) {
	const raw = packBits(width, height, 1, (x, y) => (pixels[(y * width + x) * 4] >= 128 ? 1 : 0))
	return pngFile(width, height, 1, 0, [], raw)
}

function encodeRgb8(width: number, height: number, pixels: Buffer) {
	const stride = width * 3
	const raw = Buffer.alloc((stride + 1) * height)
	for (let y = 0; y < height; y++) {
		const rowStart = y * (stride + 1)
		raw[rowStart] = 0
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4
			const o = rowStart + 1 + x * 3
			raw[o] = pixels[i]
			raw[o + 1] = pixels[i + 1]
			raw[o + 2] = pixels[i + 2]
		}
	}
	return pngFile(width, height, 8, 2, [], raw)
}

function encodeIndexed(width: number, height: number, pixels: Buffer, palette: [number, number, number][]) {
	const bitDepth: 1 | 2 | 4 | 8 = palette.length <= 2 ? 1 : palette.length <= 4 ? 2 : palette.length <= 16 ? 4 : 8
	const plte = Buffer.alloc(palette.length * 3)
	for (let i = 0; i < palette.length; i++) {
		plte[i * 3] = palette[i][0]
		plte[i * 3 + 1] = palette[i][1]
		plte[i * 3 + 2] = palette[i][2]
	}
	const raw = packBits(width, height, bitDepth, (x, y) => {
		const i = (y * width + x) * 4
		return nearestIndex(palette, pixels[i], pixels[i + 1], pixels[i + 2])
	})
	return pngFile(width, height, bitDepth, 3, [chunk('PLTE', plte)], raw)
}

function nearestIndex(palette: [number, number, number][], r: number, g: number, b: number) {
	let best = 0
	let bestDist = Infinity
	for (let i = 0; i < palette.length; i++) {
		const [pr, pg, pb] = palette[i]
		const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
		if (dist < bestDist) {
			bestDist = dist
			best = i
		}
	}
	return best
}

export function quantizePngToPalette(buffer: Buffer, colorMode: ColorModeId) {
	const {width, height, pixels} = decodePng(buffer)
	if (colorMode === 'rgb') return encodeRgb8(width, height, pixels)
	// FireBeetle firmware keeps a 64 KB PNG buffer. 1-bit packing stays under
	// that even with a photo card; true RGB will not.
	if (colorMode === 'bw') {
		ditherToBlackWhite(pixels, width, height)
		return encodeGray1(width, height, pixels)
	}
	const palette = paletteRgb(colorMode)
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4
			const [nr, ng, nb] = palette[nearestIndex(palette, pixels[i], pixels[i + 1], pixels[i + 2])]
			pixels[i] = nr
			pixels[i + 1] = ng
			pixels[i + 2] = nb
			pixels[i + 3] = 255
		}
	}
	return encodeIndexed(width, height, pixels, palette)
}
