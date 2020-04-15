import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';

/**
 * 
 * body-scroll-lock-ignore - to ignor lock.
 */
export function disableScroll(container) {
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
    enableBodyScroll(container)
}