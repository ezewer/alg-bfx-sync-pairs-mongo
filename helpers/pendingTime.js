'use strict'

function pendingTimeFunction (amount) {
  const start = Date.now()
  let i = 0
  return () => {
    const now = Date.now()
    i++
    const pendingInMinutes = parseInt(((((now - start) / 60000) / i) * (amount - i)))
    const pendingHours = Math.floor(pendingInMinutes / 60)
    const pendingMinutes = Math.floor(pendingInMinutes) % 60
    const showMinutes = (pendingMinutes >= 10) ? pendingMinutes : `0${pendingMinutes}`
    return `${pendingHours}:${showMinutes} Hr`
  }
}

module.exports = {
  pendingTimeFunction
}
