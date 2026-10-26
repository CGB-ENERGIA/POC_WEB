import * as echarts from 'echarts'
const BRAND = '#8B1C2B'
const vals = [230, 237, 259, 288, 245, 192, 106, 236, 160, 174, 0, 0]
const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

function withAlpha(c: string, a: number): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(c)
  if (hex) { const n = parseInt(hex[1]!, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})` }
  return c
}

function option(selecionado: number | null, dark: boolean) {
  const axis = dark ? '#f1f5f9' : '#334155'
  const muted = dark ? '#e2e8f0' : '#64748b'
  const halo = dark ? '#0f172a' : '#ffffff'
  return {
    grid: { left: 8, right: 16, top: 32, bottom: 8 },
    xAxis: { type: 'category', data: meses, axisLine: { lineStyle: { color: dark ? '#64748b' : '#e2e8f0' } }, axisTick: { show: false }, axisLabel: { color: muted, fontSize: 11 } },
    yAxis: { type: 'value', show: false, splitLine: { show: false } },
    series: [{
      type: 'line',
      data: vals.map((v, i) => {
        const filtrado = selecionado !== null
        const sel = filtrado && selecionado === i
        const apagado = filtrado && !sel
        return {
          value: v,
          itemStyle: apagado ? { color: withAlpha(BRAND, 0.35) } : undefined,
          label: sel ? { color: BRAND, fontSize: 13, fontWeight: 'bold' } : { color: axis, fontSize: 11, fontWeight: 'bold' },
        }
      }),
      smooth: false, symbol: 'circle', symbolSize: 7,
      lineStyle: { color: BRAND, width: 3 },
      itemStyle: { color: BRAND, borderColor: halo, borderWidth: 2 },
      label: { show: true, position: 'top', fontSize: 11, fontWeight: 'bold', color: axis, formatter: (p: { value: number }) => (p.value ? String(p.value) : '') },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(139,28,43,.22)' }, { offset: 1, color: 'rgba(139,28,43,0)' }] } },
    }],
  }
}
echarts.init(document.getElementById('a')!).setOption(option(9, false) as never)
echarts.init(document.getElementById('b')!).setOption(option(null, false) as never)
echarts.init(document.getElementById('c')!).setOption(option(9, true) as never)
