export default function waitUntil(fn, { timeout = 5000, interval = 500 } = {}) {
  let timer = null
  let intervalTimer = null
  return new Promise(function (res, rej) {
    timer = setTimeout(rej, timeout, new Error('Error: Timeout'))
    intervalTimer = setInterval(async () => {
      try {
        const result = await fn()
        clearTimeout(timer)
        clearInterval(intervalTimer)
        res(result)
      } catch (_e) {}
    }, interval)
  })
}
