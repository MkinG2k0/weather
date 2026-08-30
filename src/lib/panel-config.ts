export const BLOCK_IDS = ['current','forecast','feels','humidity','pressure','precipitation','metrics','wind','sun','clouds'] as const
export type BlockId = (typeof BLOCK_IDS)[number]
export type LanguageCode = 'RU'|'EN'
export type UnitSystemCode = 'METRIC'|'IMPERIAL'

export const MAX_BLOCKS = 4
export type PanelLayout = {blocks:BlockId[]}
export const DEFAULT_LAYOUT:PanelLayout={blocks:['current','metrics','wind','forecast']}

export type EditablePanel={
	id:string;name:string;slug:string;cityName:string;latitude:number;longitude:number;timezone:string
	language:LanguageCode;unitSystem:UnitSystemCode;refreshMinutes:number;layout:PanelLayout;updatedAt:string
}

export function normalizeLayout(value:unknown):PanelLayout{
	if(!value||typeof value!=='object')return DEFAULT_LAYOUT
	const source=value as {blocks?:unknown;order?:unknown;hidden?:unknown;showForecast?:unknown}
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
	return {blocks:(blocks.length?blocks:DEFAULT_LAYOUT.blocks).slice(0,MAX_BLOCKS)}
}
