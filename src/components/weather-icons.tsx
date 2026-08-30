type WeatherIconProps = {code: number; size: number; fill?: boolean; color?: string; accent?: string}

function iconKind(code: number) {
	if (code === 0) return 'sun'
	if (code === 1) return 'mostlyClear'
	if (code === 2) return 'partlyCloudy'
	if (code === 3) return 'overcast'
	if (code === 45 || code === 48) return 'fog'
	if (code >= 51 && code <= 57) return 'drizzle'
	if (code === 65 || code === 82) return 'heavyRain'
	if (code === 66 || code === 67) return 'sleet'
	if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
	if (code === 75 || code === 86) return 'heavySnow'
	if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
	if (code >= 95) return 'thunder'
	return 'overcast'
}

function ray(cx: number, cy: number, r: number, deg: number) {
	const rad = deg * Math.PI / 180
	const inner = r + 2.4
	const outer = r + 5.6
	return {x1: cx + Math.cos(rad) * inner, y1: cy + Math.sin(rad) * inner, x2: cx + Math.cos(rad) * outer, y2: cy + Math.sin(rad) * outer}
}

function Sun({cx = 16, cy = 16, r = 6, fill}: {cx?: number; cy?: number; r?: number; fill?: string}) {
	const degrees = [0, 45, 90, 135, 180, 225, 270, 315]
	return <g>
		<circle cx={cx} cy={cy} r={r} fill={fill}/>
		{degrees.map(deg => {
			const line = ray(cx, cy, r, deg)
			return <line key={deg} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}/>
		})}
	</g>
}

export function WeatherIcon({code, size, fill=false, color='#000', accent}: WeatherIconProps) {
	const kind = iconKind(code)
	const mark = accent ?? color
	return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" preserveAspectRatio="xMidYMid meet" style={fill?{display:'flex',width:'100%',height:'100%',minWidth:0,minHeight:0,maxWidth:'100%',maxHeight:'100%'}:{display:'flex',width:size,height:size,maxWidth:'100%',maxHeight:'100%',flexShrink:1}}>
		{kind === 'sun' ? <Sun fill={mark}/> : null}
		{kind === 'mostlyClear' ? <g><Sun cx={11} cy={12} r={5} fill={mark}/><path d="M10 22.5h13.4a3.4 3.4 0 0 0 .3-6.7 5.6 5.6 0 0 0-10.6-1.1A4 4 0 0 0 10 22.5z"/></g> : null}
		{kind === 'partlyCloudy' ? <g><Sun cx={21} cy={10.5} r={4.4} fill={mark}/><path d="M10.5 22.2h13.2a3.6 3.6 0 0 0 .4-7.2 6.2 6.2 0 0 0-11.8-1.3 4.4 4.4 0 0 0-1.8 8.5z"/></g> : null}
		{kind === 'overcast' ? <path d="M8 13.2a5.4 5.4 0 0 1 10.2-1.4 4.8 4.8 0 0 1 6.3 4.6 3.6 3.6 0 0 1-.2 7.1H10.4A4.6 4.6 0 0 1 8 13.2z"/> : null}
		{kind === 'fog' ? <g><path d="M10.5 18.2h13.2a3.6 3.6 0 0 0 .4-7.2 6.2 6.2 0 0 0-11.8-1.3 4.4 4.4 0 0 0-1.8 8.5z"/><line x1="7" y1="22" x2="22" y2="22"/><line x1="7" y1="25.2" x2="25" y2="25.2"/><line x1="7" y1="28.4" x2="22" y2="28.4"/></g> : null}
		{kind === 'drizzle' ? <g><path d="M10.5 16.2h13.2a3.6 3.6 0 0 0 .4-7.2 6.2 6.2 0 0 0-11.8-1.3 4.4 4.4 0 0 0-1.8 8.5z"/><line x1="11" y1="21" x2="9.6" y2="25.6"/><line x1="16" y1="21" x2="14.6" y2="25.6"/><line x1="21" y1="21" x2="19.6" y2="25.6"/></g> : null}
		{kind === 'rain' ? <g><path d="M10.5 15.2h13.2a3.6 3.6 0 0 0 .4-7.2 6.2 6.2 0 0 0-11.8-1.3 4.4 4.4 0 0 0-1.8 8.5z"/><line x1="10.5" y1="20.4" x2="8.6" y2="26.8"/><line x1="15.7" y1="20.4" x2="13.8" y2="26.8"/><line x1="20.9" y1="20.4" x2="19" y2="26.8"/></g> : null}
		{kind === 'heavyRain' ? <g><path d="M10.5 14.2h13.2a3.6 3.6 0 0 0 .4-7.2 6.2 6.2 0 0 0-11.8-1.3 4.4 4.4 0 0 0-1.8 8.5z"/><line x1="9.4" y1="19.6" x2="7.2" y2="27.4" strokeWidth="1.8"/><line x1="13.6" y1="19.6" x2="11.4" y2="27.4" strokeWidth="1.8"/><line x1="17.8" y1="19.6" x2="15.6" y2="27.4" strokeWidth="1.8"/><line x1="22" y1="19.6" x2="19.8" y2="27.4" strokeWidth="1.8"/></g> : null}
		{kind === 'sleet' ? <g><path d="M10.5 15.2h13.2a3.6 3.6 0 0 0 .4-7.2 6.2 6.2 0 0 0-11.8-1.3 4.4 4.4 0 0 0-1.8 8.5z"/><line x1="11" y1="20.5" x2="9.2" y2="25.8"/><circle cx="17.2" cy="23.6" r="1.15" fill={color} stroke="none"/><line x1="22" y1="20.5" x2="20.2" y2="25.8"/></g> : null}
		{kind === 'snow' ? <g>
			<path d="M10.5 15.2h13.2a3.6 3.6 0 0 0 .4-7.2 6.2 6.2 0 0 0-11.8-1.3 4.4 4.4 0 0 0-1.8 8.5z"/>
			<line x1="11.2" y1="21.1" x2="11.2" y2="25.7"/><line x1="9.2" y1="22.25" x2="13.2" y2="24.55"/><line x1="9.2" y1="24.55" x2="13.2" y2="22.25"/>
			<line x1="16.2" y1="21.1" x2="16.2" y2="25.7"/><line x1="14.2" y1="22.25" x2="18.2" y2="24.55"/><line x1="14.2" y1="24.55" x2="18.2" y2="22.25"/>
			<line x1="21.2" y1="21.1" x2="21.2" y2="25.7"/><line x1="19.2" y1="22.25" x2="23.2" y2="24.55"/><line x1="19.2" y1="24.55" x2="23.2" y2="22.25"/>
		</g> : null}
		{kind === 'heavySnow' ? <g>
			<path d="M10.5 14.2h13.2a3.6 3.6 0 0 0 .4-7.2 6.2 6.2 0 0 0-11.8-1.3 4.4 4.4 0 0 0-1.8 8.5z"/>
			<line x1="9.6" y1="21.5" x2="9.6" y2="25.7"/><line x1="7.8" y1="22.5" x2="11.4" y2="24.7"/><line x1="7.8" y1="24.7" x2="11.4" y2="22.5"/>
			<line x1="13.8" y1="21.5" x2="13.8" y2="25.7"/><line x1="12" y1="22.5" x2="15.6" y2="24.7"/><line x1="12" y1="24.7" x2="15.6" y2="22.5"/>
			<line x1="18" y1="21.5" x2="18" y2="25.7"/><line x1="16.2" y1="22.5" x2="19.8" y2="24.7"/><line x1="16.2" y1="24.7" x2="19.8" y2="22.5"/>
			<line x1="22.2" y1="21.5" x2="22.2" y2="25.7"/><line x1="20.4" y1="22.5" x2="24" y2="24.7"/><line x1="20.4" y1="24.7" x2="24" y2="22.5"/>
		</g> : null}
		{kind === 'thunder' ? <g><path d="M10.5 14.2h13.2a3.6 3.6 0 0 0 .4-7.2 6.2 6.2 0 0 0-11.8-1.3 4.4 4.4 0 0 0-1.8 8.5z"/><path d="M15.2 18.6 12.4 24h3.1l-1.6 5.4 6.2-7.4h-3.2l2.2-3.4z" fill={mark} stroke="none"/></g> : null}
	</svg>
}
