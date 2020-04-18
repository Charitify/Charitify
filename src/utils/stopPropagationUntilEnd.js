


import getScrollPercent from './getScrollPercent'

let isInRange = true
export default function stopPropagationUntilEnd(el, onScrollState = () => {}) {
    el.ontouchstart = controllScroll
    el.ontouchmove = controllScroll
    el.ontouchend = controllScroll
    
    function controllScroll(e) {
        const scroll = getScrollPercent(el, el.children[0])
        if (scroll >= 0 && scroll <= 100) {
            e.stopPropagation()
            if (!isInRange) {
                isInRange = true
                onScrollState(true)
            }
        } else {
            if (isInRange) {
                isInRange = false
                onScrollState(false)
            }
        }
    }
}