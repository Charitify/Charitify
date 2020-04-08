export function disableScroll() {
    // const scrollDistance = document.documentElement.scrollTop

    document.body.classList.add('body-scroll-lock')

    // const vpH = window.innerHeight;
    // document.documentElement.style.height = vpH.toString() + "px";
    // document.body.style.height = vpH.toString() + "px";

    // console.log(scrollDistance)
    // document.body.scrollTop = scrollDistance
}

export function enableScroll() {
    document.body.classList.remove('body-scroll-lock')
    // document.documentElement.style.height = null
    // document.body.style.height = null

    // document.documentElement.classList.remove('overflow-hidden')
    // document.body.classList.remove('overflow-hidden')
    // document.body.removeEventListener("touchmove", freezeVp, false);
}

// function freezeVp(e) {
    // e.preventDefault();
// };