//
// Asynchronous functionality
// ---
import { safeSetTimeout } from './error'

export function throttle (callback, timeout) {
  let timeoutInstance
  return function (...args) {
    if (!timeoutInstance) {
      timeoutInstance = safeSetTimeout(function () {
        timeoutInstance = undefined
        callback(...args)
      }, timeout)
    }
  }
}

export function debounce (callback, timeout) {
  let timeoutInstance
  return function (...args) {
    clearTimeout(timeoutInstance)
    timeoutInstance = safeSetTimeout(() => callback(...args), timeout)
  }
}
