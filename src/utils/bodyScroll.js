import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';

const DURATION = 1000
let scroll
function preventInertialScroll(e) {
    if (e.touches.length !== 1) return

    function recursive() {
        if (document.documentElement.scrollTop !== scroll) {
            document.documentElement.scrollTop = scroll
            requestAnimationFrame(recursive)
        } else {
            const time = performance.now()
            function stopScroll() {
                if (performance.now() - time < DURATION) {
                    document.documentElement.scrollTop = scroll
                    requestAnimationFrame(stopScroll)
                }
            }
            stopScroll()
        }
    }
    recursive()
}

/**
 * 
 * body-scroll-lock-ignore - to ignor lock.
 */
export function disableScroll(container) {
    if (typeof window !== 'undefined') {
        document.body.classList.add('body-scroll-lock')
        document.documentElement.ontouchstart = () => scroll = document.documentElement.scrollTop
        document.documentElement.ontouchmove = preventInertialScroll
        document.documentElement.ontouchend = preventInertialScroll
    }

    disableBodyScroll(container, {
        allowTouchMove: el => {
            while (el && el !== document.body) {
                if (el.getAttribute('body-scroll-lock-ignore') !== null) {
                    return true;
                }
                el = el.parentNode;
            }
        },
    })
}

export function enableScroll(container) {
    if (typeof window !== 'undefined') {
        document.body.classList.remove('body-scroll-lock')
        document.documentElement.ontouchstart = null
        document.documentElement.ontouchmove = null
        document.documentElement.ontouchend = null
    }

    enableBodyScroll(container)
}