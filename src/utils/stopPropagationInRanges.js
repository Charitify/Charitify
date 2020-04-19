


import getScrollPercent from './getScrollPercent'

let isInRange = true
export default function stopPropagationInRanges(el, ranges = { x: [0, 100], y: [0, 100] }, onChange) {
    el.ontouchstart = controllScroll
    el.ontouchmove = controllScroll
    el.ontouchend = controllScroll
    
    function controllScroll(e) {
        const { x, y } = getScrollPercent(el, el.children[0])
        if (typeof onChange === 'function') {
            onChange({ x, y })
        }
        if (
            x >= ranges.x[0] && x <= ranges.x[1] &&
            y >= ranges.y[0] && y <= ranges.y[1]
        ) {
            e.stopPropagation()
        }
    }
}