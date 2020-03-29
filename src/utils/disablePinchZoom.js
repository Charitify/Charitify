// Disable pinch zoom
export default function disablePinchZoom(elements) {
    return new Promise((res, rej) => {
        try {
            [].concat(elements || []).forEach((el) => {
                document.documentElement.addEventListener('gesturechange', function (event) {
                    event.preventDefault();
                }, { passive: false });
            })
            res()
        } catch (err) {
            console.error(err)
            rej(err)
        }
    })
}