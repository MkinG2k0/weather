export type SensorTempPoint = {t:number;c:number}

export const SENSOR_CHART_RANGES = ['hour','hours3','hours6','hours12','hours23','days3','week','month'] as const
export type SensorChartRangeId = (typeof SENSOR_CHART_RANGES)[number]
export const DEFAULT_SENSOR_CHART_RANGE: SensorChartRangeId = 'hours23'
export const SENSOR_CHART_HOURS: Record<SensorChartRangeId, number> = {
	hour:1, hours3:3, hours6:6, hours12:12, hours23:23, days3:72, week:168, month:24*31,
}

export function isSensorChartRange(value:unknown):value is SensorChartRangeId{
	return typeof value==='string'&&(SENSOR_CHART_RANGES as readonly string[]).includes(value)
}

export function parseSensorLog(value:unknown):SensorTempPoint[]{
	if(!Array.isArray(value))return []
	const points:SensorTempPoint[]=[]
	for(const item of value){
		if(!item||typeof item!=='object')continue
		const raw=item as Record<string,unknown>
		const t=Number(raw.t)
		const c=Number(raw.c)
		if(!Number.isFinite(t)||!Number.isFinite(c)||c<-40||c>85)continue
		points.push({t:Math.round(t),c:Math.round(c*100)/100})
	}
	return points
}

export function parseSensorHistParam(raw:string):SensorTempPoint[]{
	const parts=raw.split(',').map(part=>part.trim()).filter(Boolean)
	if(parts.length<2)return []
	const start=Number(parts[0])
	const firstTenth=Number(parts[1])
	if(!Number.isFinite(start)||start<1_600_000_000||!Number.isFinite(firstTenth))return []
	const points:SensorTempPoint[]=[{t:Math.round(start),c:firstTenth/10}]
	let ts=Math.round(start)
	for(let i=2;i+1<parts.length;i+=2){
		const minutes=Number(parts[i])
		const tenth=Number(parts[i+1])
		if(!Number.isFinite(minutes)||!Number.isFinite(tenth))continue
		ts+=Math.round(minutes)*60
		points.push({t:ts,c:tenth/10})
	}
	return points.filter(point=>point.c>=-40&&point.c<=85)
}

export function mergeSensorLog(existing:unknown, incoming:SensorTempPoint[], nowSec=Math.floor(Date.now()/1000)):SensorTempPoint[]{
	const merged=new Map<number,number>()
	for(const point of [...parseSensorLog(existing),...incoming]){
		if(point.t>nowSec+300)continue
		const bucket=Math.round(point.t/60)*60
		merged.set(bucket,point.c)
	}
	return [...merged.entries()]
		.sort((a,b)=>a[0]-b[0])
		.map(([t,c])=>({t,c}))
}

export function sliceSensorLog(log:SensorTempPoint[], hours:number, nowSec=Math.floor(Date.now()/1000)):SensorTempPoint[]{
	const from=nowSec-Math.max(1,hours)*3600
	return log.filter(point=>point.t>=from)
}

export function downsampleSensorLog(points:SensorTempPoint[], maxPoints=48):SensorTempPoint[]{
	if(points.length<=maxPoints)return points
	const out:SensorTempPoint[]=[]
	const step=(points.length-1)/Math.max(1,maxPoints-1)
	for(let i=0;i<maxPoints;i++){
		const index=Math.round(i*step)
		out.push(points[Math.min(points.length-1,index)])
	}
	return out
}

export const SENSOR_CHART_CAPTIONS: Record<SensorChartRangeId,{ru:string;en:string}> = {
	hour:{ru:'1 Ч',en:'1H'},
	hours3:{ru:'3 Ч',en:'3H'},
	hours6:{ru:'6 Ч',en:'6H'},
	hours12:{ru:'12 Ч',en:'12H'},
	hours23:{ru:'23 Ч',en:'23H'},
	days3:{ru:'3 ДНЯ',en:'3 DAYS'},
	week:{ru:'НЕДЕЛЯ',en:'WEEK'},
	month:{ru:'МЕСЯЦ',en:'MONTH'},
}

export function incomingSensorPoints(requestUrl:string, nowSec=Math.floor(Date.now()/1000)):SensorTempPoint[]{
	const params=new URL(requestUrl).searchParams
	const points=parseSensorHistParam(params.get('hist')??'')
	const tempRaw=params.get('temp_c')
	if(tempRaw!==null&&tempRaw!==''){
		const tempC=Number(tempRaw)
		if(Number.isFinite(tempC)&&tempC>=-40&&tempC<=85)points.push({t:nowSec,c:Math.round(tempC*100)/100})
	}
	return points
}

export function demoSensorLog(now=new Date()):SensorTempPoint[]{
	const nowSec=Math.floor(now.getTime()/1000)
	const points:SensorTempPoint[]=[]
	for(let ageMin=31*24*60;ageMin>=0;ageMin-=20){
		const t=nowSec-ageMin*60
		const hour=(t/3600)%24
		const c=21.6+Math.sin(hour/24*Math.PI*2)*1.8+Math.sin(t/86400)*0.4
		points.push({t,c:Math.round(c*10)/10})
	}
	return points
}
