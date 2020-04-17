import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';

let scroll

/**
 * 
 * body-scroll-lock-ignore - to ignor lock.
 */
export function disableScroll(container) {
    document.documentElement.ontouchstart = (e) => scroll = document.documentElement.scrollTop
    document.documentElement.ontouchmove = (e) => document.documentElement.scrollTop = scroll
    document.documentElement.ontouchend = (e) => {
        function recursive() {
            if (document.documentElement.scrollTop !== scroll) {
                document.documentElement.scrollTop = scroll
                console.log(document.documentElement.scrollTop, scroll)
                requestAnimationFrame(recursive)
            } else {
                let time = performance.now()
                function stopScroll() {
                    document.documentElement.scrollTop = scroll
                    if (performance.now() - time < 1000) {
                        requestAnimationFrame(stopScroll)
                    }
                }
                stopScroll()
            }
        }
        recursive()
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
    document.documentElement.ontouchstart = null
    document.documentElement.ontouchmove = null
    document.documentElement.ontouchend = null

    enableBodyScroll(container)
}