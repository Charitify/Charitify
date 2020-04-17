import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';

let scroll
function preventInertialScroll(e) {
    function recursive() {
        if (document.documentElement.scrollTop !== scroll) {
            // document.documentElement.scrollTop = scroll
            document.documentElement.scrollTo({ top: scroll, behavior: 'smooth' });
            requestAnimationFrame(recursive)
        } else {
            let time = performance.now()
            function stopScroll() {
                // document.documentElement.scrollTop = scroll
                document.documentElement.scrollTo({ top: scroll, behavior: 'smooth' });
                if (performance.now() - time < 1000) {
                    requestAnimationFrame(stopScroll)
                }
            }
            stopScroll()
        }
    }
    e.stopPropagation()
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