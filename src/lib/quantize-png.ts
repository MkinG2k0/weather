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

function encodePng(width: number, height: number, pixels: Buffer) {
	const stride = width * 4
	const raw = Buffer.alloc((stride + 1) * height)
	for (let y = 0; y < height; y++) {
		raw[y * (stride + 1)] = 0
		pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
	}
	const ihdr = Buffer.alloc(13)
	ihdr.writeUInt32BE(width, 0)
	ihdr.writeUInt32BE(height, 4)
	ihdr[8] = 8
	ihdr[9] = 6
	return Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		chunk('IHDR', ihdr),
		chunk('IDAT', deflateSync(raw, {level: 9})),
		chunk('IEND', Buffer.alloc(0)),
	])
}

function nearest(palette: [number, number, number][], r: number, g: number, b: number) {
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
	return palette[best]
}

export function quantizePngToPalette(buffer: Buffer, colorMode: ColorModeId) {
	if (colorMode === 'rgb') return buffer
	const palette = paletteRgb(colorMode)
	const {width, height, pixels} = decodePng(buffer)
	const twoColor = palette.length === 2
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4
			const r = pixels[i]
			const g = pixels[i + 1]
			const b = pixels[i + 2]
			const [nr, ng, nb] = twoColor
				? (0.299 * r + 0.587 * g + 0.114 * b < 160 ? [0, 0, 0] : [255, 255, 255])
				: nearest(palette, r, g, b)
			pixels[i] = nr
			pixels[i + 1] = ng
			pixels[i + 2] = nb
			pixels[i + 3] = 255
		}
	}
	return encodePng(width, height, pixels)
}
