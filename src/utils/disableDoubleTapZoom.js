export default function disableDoubleTapZoom(elements) {
    [].concat(elements || []).forEach((el) => {
        let lastTouchEnd = 0;
		el.addEventListener('touchend', function(event) {
			const now = (new Date()).getTime();
			if (now - lastTouchEnd <= 300) {
				event.preventDefault();
			}
			lastTouchEnd = now;
		}, false);
    })
}