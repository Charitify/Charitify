


export default function getScrollPercent(container, child) {
    const h = container
    const b = child
    const st = 'scrollTop'
    const sh = 'scrollHeight'
    return (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight) * 100
}
