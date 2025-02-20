//
// Object functions
//

export function hasOwnProperty(obj, propName) {
  return Object.prototype.hasOwnProperty.call(obj, propName)
}

/**
 * True when obj is a non-null object, or a function.
 * @param obj 
 * @returns 
 */
export function isObjectLike(obj) {
  if (obj === null) { return false }
  return typeof obj === 'object' || typeof obj === 'function'
}

export function extend (target, source) {
  if (source) {
    for (var prop in source) {
      if (hasOwnProperty(source, prop)) {
        target[prop] = source[prop]
      }
    }
  }
  return target
}

export function objectForEach (obj, action) {
  for (var prop in obj) {
    if (hasOwnProperty(obj, prop)) {
      action(prop, obj[prop])
    }
  }
}

export function objectMap (source, mapping, thisArg? : any) {
  if (!source) { return source }
  if (arguments.length > 2) { mapping = mapping.bind(thisArg) }
  var target = {}
  for (var prop in source) {
    if (hasOwnProperty(source, prop)) {
      target[prop] = mapping(source[prop], prop, source)
    }
  }
  return target
}
export function getObjectOwnProperty (obj, propName) {
  return hasOwnProperty(obj, propName) ? obj[propName] : undefined
}

export function clonePlainObjectDeep (obj, seen) {
  if (!seen) { seen = [] }

  if (!obj || typeof obj !== 'object' ||
        obj.constructor !== Object ||
        seen.indexOf(obj) !== -1) {
    return obj
  }

    // Anything that makes it below is a plain object that has not yet
    // been seen/cloned.
  seen.push(obj)

  var result = {}
  for (var prop in obj) {
    if (hasOwnProperty(obj, prop)) {
      result[prop] = clonePlainObjectDeep(obj[prop], seen)
    }
  }
  return result
}

/**
 * JSON.stringify, but inserts `...` for objects that are referenced
 * multiple times, preventing infinite recursion.
 */
export function safeStringify (value) {
  const seen = new Set()
  return JSON.stringify(value, (k, v) => {
    if (seen.has(v)) { return '...' }
    if (typeof v === 'object') { seen.add(v) }
    return v
  })
}


/**
 * Promises/A+ compliant isThenable (per section 1.2)
 */
export function isThenable (object: any) {
  return isObjectLike(object) && typeof object.then === 'function'
}
