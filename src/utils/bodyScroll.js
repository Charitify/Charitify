import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';

const DURATION = 500
let scroll
let scrollCheckInterval
function preventInertialScroll(e) {
    if (e && e.touches.length !== 1) return

    function scrollTo(top) {
        // document.documentElement.scrollTop = scroll
        window.scrollTo({
            top,
            left: 0,
            behavior: 'smooth'
        });
    }

    function recursive() {
        if (document.documentElement.scrollTop !== scroll) {
            scrollTo(scroll)
            requestAnimationFrame(recursive)
        } else {
            const time = performance.now()
            function stopScroll() {
                if (performance.now() - time < DURATION) {
                    scrollTo(scroll)
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