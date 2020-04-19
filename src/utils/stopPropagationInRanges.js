


import getScrollPercent from './getScrollPercent'

export default function stopPropagationInRanges(el, ranges = { x: [0, 100], y: [0, 100] }, onChange) {
    el.ontouchstart = controllScroll
    el.ontouchmove = controllScroll
    el.ontouchend = controllScroll
    
    function controllScroll(e) {
        const params = getScrollPercent(el, el.children[0])
        if (
            params.x >= ranges.x[0] && params.x <= ranges.x[1] &&
            params.y >= ranges.y[0] && params.y <= ranges.y[1]
        ) {
            e.stopPropagation()
        }
        if (typeof onChange === 'function') {
            return onChange({ ...params, e })
        }
    }
}