


export default function getScrollPercent(container, child) {
    const p = container
    const c = child
    const st = 'scrollTop'
    const sl = 'scrollLeft'
    const sh = 'scrollHeight'
    const sw = 'scrollWidth'
    return {
       x:  (p[sl] || c[sl]) / (((p[sw] || c[sw]) - p.clientWidth) || 1) * 100,
       y:  (p[st] || c[st]) / (((p[sh] || c[sh]) - p.clientHeight) || 1) * 100,
    }
}
