export const BLOCK_IDS = [
	'current','overview','photo','weatherScene','clock','forecast','dailyForecast','weekStrip','weekTiles','weekRange','temperatureChart','precipitationChart','windChart',
	'feels','humidity','pressure','precipitation','precipitationDetail','metrics','wind','sun','daylight','clouds',
	'cloudLayers','visibility','dewPoint','uv','radiation','airQuality','sensor',
] as const
export type BlockId = (typeof BLOCK_IDS)[number]
export type LanguageCode = 'RU'|'EN'
export type UnitSystemCode = 'METRIC'|'IMPERIAL'

export const MAX_BLOCKS = 8
export const CARD_SPANS = [1,2,3,4] as const
export type CardSpan = (typeof CARD_SPANS)[number]
export type PanelLayout = {blocks:BlockId[];spans:Partial<Record<BlockId,CardSpan>>;photoDataUrl?:string}
export const DEFAULT_LAYOUT:PanelLayout={blocks:['current','clock','weatherScene','temperatureChart','precipitationChart'],spans:{weatherScene:2,temperatureChart:2,precipitationChart:2}}

const DEFAULT_CARD_SPANS:Partial<Record<BlockId,CardSpan>>={overview:4,photo:2,weatherScene:2,clock:2,dailyForecast:4,weekStrip:4,weekTiles:4,weekRange:4,temperatureChart:2,precipitationChart:2,windChart:2,precipitationDetail:2,daylight:2,cloudLayers:2,radiation:2,airQuality:2,sensor:2}
export function getDefaultCardSpan(id:BlockId):CardSpan{return DEFAULT_CARD_SPANS[id]??1}

export function getCardSpan(layout:PanelLayout,id:BlockId):CardSpan{return layout.spans?.[id]??1}

export function packBlockRows(layout:PanelLayout){
	const rows:{blocks:BlockId[];used:number}[]=[]
	for(const id of layout.blocks){
		const span=getCardSpan(layout,id)
		let row=rows.at(-1)
		if(!row||row.used+span>4){row={blocks:[],used:0};rows.push(row)}
		row.blocks.push(id);row.used+=span
	}
	return rows
}

export function layoutFits(layout:PanelLayout){return packBlockRows(layout).length<=2}

export type EditablePanel={
	id:string;name:string;slug:string;cityName:string;latitude:number;longitude:number;timezone:string
	language:LanguageCode;unitSystem:UnitSystemCode;refreshMinutes:number;layout:PanelLayout;updatedAt:string
}

export function normalizeLayout(value:unknown):PanelLayout{
	if(!value||typeof value!=='object')return DEFAULT_LAYOUT
	const source=value as {blocks?:unknown;order?:unknown;hidden?:unknown;showForecast?:unknown;spans?:unknown;photoDataUrl?:unknown}
	let candidates:unknown[]=Array.isArray(source.blocks)?source.blocks:[]
	// Convert layouts stored by the first editor version.
	if(!candidates.length&&Array.isArray(source.order)){
		const hidden=new Set(Array.isArray(source.hidden)?source.hidden:[])
		candidates=source.order.filter(id=>!hidden.has(id))
	}
	const blocks=[...new Set(candidates.filter((id):id is BlockId=>BLOCK_IDS.includes(id as BlockId)))]
	// Forecast used to be a special footer. Promote it to a regular card when
	// loading old saved layouts, so no database migration is required.
	if(source.showForecast===true&&!blocks.includes('forecast'))blocks.push('forecast')
	const normalizedBlocks=(blocks.length?blocks:DEFAULT_LAYOUT.blocks).slice(0,MAX_BLOCKS)
	const rawSpans=source.spans&&typeof source.spans==='object'?source.spans as Record<string,unknown>:{}
	const spans:Partial<Record<BlockId,CardSpan>>={}
	for(const id of normalizedBlocks){const span=rawSpans[id];if(CARD_SPANS.includes(span as CardSpan)&&span!==1)spans[id]=span as CardSpan}
	const photoDataUrl=typeof source.photoDataUrl==='string'&&/^data:image\/(?:png|jpeg|webp);base64,/.test(source.photoDataUrl)&&source.photoDataUrl.length<=1_500_000?source.photoDataUrl:undefined
	const layout={blocks:normalizedBlocks,spans,...(photoDataUrl?{photoDataUrl}:{})}
	return layoutFits(layout)?layout:{blocks:normalizedBlocks,spans:{}}
}
