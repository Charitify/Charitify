import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';

const DURATION = 500
let scroll
let scrollCheckInterval
function preventInertialScroll(e) {
    if (e && e.touches.length !== 1) return

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
            scroll = document.documentElement.scrollTop
            document.documentElement.ontouchstart = () => scroll = document.documentElement.scrollTop
            document.documentElement.ontouchmove = preventInertialScroll
            document.documentElement.ontouchend = preventInertialScroll
            scrollCheckInterval = setInterval(() => {
                console.log(document.documentElement.scrollTop !== scroll, document.documentElement.scrollTop, scroll)
                if (document.documentElement.scrollTop !== scroll) {
                    preventInertialScroll()
                }
            }, DURATION)
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
            clearInterval(scrollCheckInterval)
        }
    }

    enableBodyScroll(container)
}