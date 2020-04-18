import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';

const DURATION = 500
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
 * @attr body-scroll-lock-ignore - to ignor lock.
 * 
 * @param {HTMLElement} container
 * @param {{
 *  extraLock?: boolean (false)
 * }} config
 */
export function disableScroll(container, config = {}) {
    if (typeof window !== 'undefined') {
        document.body.classList.add('body-scroll-lock')

        if (config.extraLock) {
            document.documentElement.ontouchstart = () => scroll = document.documentElement.scrollTop
            document.documentElement.ontouchmove = preventInertialScroll
            document.documentElement.ontouchend = preventInertialScroll
        }
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

export function enableScroll(container, config = {}) {
    if (typeof window !== 'undefined') {
        document.body.classList.remove('body-scroll-lock')

        if (config.extraLock) {
            document.documentElement.ontouchstart = null
            document.documentElement.ontouchmove = null
            document.documentElement.ontouchend = null
        }
    }

    enableBodyScroll(container)
}