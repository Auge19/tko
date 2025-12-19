/**
 * Create an ES
 */

import {
  Observable,
  observable,
  observableArray,
  unwrap
} from '@tko/observable'

import {
  computed,
  Computed
} from './computed'

const PROXY_SYM = Symbol('Knockout Proxied Object')
const MIRROR_SYM = Symbol('Knockout Proxied Observables')

type Mirror<T> = {
  [PROXY_SYM]: T,
  [MIRROR_SYM]: Mirror<T>,
  [key: string]: Observable<any> | Computed<any>
}


type ReadableComputeds<T> = {
  readonly [K in keyof T as T[K] extends () => any ? K : never]:
  T[K] extends () => infer R ? R : never
}

type WritableComputeds<T> = {
  [K in keyof T as T[K] extends (arg: any, ...rest: any[]) => any ? K : never]:
  T[K] extends (arg: infer A, ...rest: any[]) => any ? A : never
}

type NonFunctions<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K]
}

type MirroredProxy<T extends object> =
  ReadableComputeds<T> &
  WritableComputeds<T> &
  NonFunctions<T> & {
    (...args: any[]): T
  }

function makeComputed(proxy, fn) {
  return computed({
    owner: proxy,
    read: fn,
    write: fn,
    pure: 'pure' in fn ? fn.pure : true,
    deferEvaluation: 'deferEvaluation' in fn ? fn.deferEvaluation : true
  }).extend({ deferred: true })
}

function setOrCreate<T>(mirror: Mirror<T>, prop: string, value: any, proxy: T) {
  if (!mirror[prop]) {
    const ctr = Array.isArray(value) ? observableArray
      : typeof value === 'function' ? makeComputed.bind(null, proxy)
        : observable
    mirror[prop] = ctr(value)
  } else {
    mirror[prop](value)
  }
}

function assignOrUpdate<T extends object>(mirror: Mirror<T>, object: T, proxy: T) {
  for (const key of Object.keys(object)) {
    setOrCreate(mirror, key, object[key], proxy)
  }
  return object
}

export function proxy<T extends object>(object: T): MirroredProxy<T> {
  const mirror = createMirror(object)
  const proxy = new Proxy<T>(object, {
    has(target, prop) { return prop in mirror },
    get(target, prop: string) { return unwrap(mirror[prop]) },
    set(target, prop: string, value, receiver) {
      setOrCreate(mirror, prop, value, proxy)
      object[prop] = value
      return true
    },
    deleteProperty(property) {
      delete mirror[property as any]
      return delete object[property as any]
    },
    apply(target, thisArg, [props]) {
      if (props) {
        assignOrUpdate(mirror, props, proxy)
        return Object.assign(object, props)
      }
      return object
    },
    getPrototypeOf() { return Object.getPrototypeOf(object) },
    setPrototypeOf(target, proto) { return Object.setPrototypeOf(object, proto) },
    defineProperty(target, prop, desc) {
      Object.defineProperty(object, prop, desc)
      return true
    },
    preventExtensions() {
      Object.preventExtensions(object)
      return true
    },
    isExtensible() { return Object.isExtensible(object) },
    ownKeys() {
      return [...Object.getOwnPropertyNames(object),
      ...Object.getOwnPropertySymbols(object)]
    }
  })
  assignOrUpdate(mirror, object, proxy)
  return proxy as MirroredProxy<T>
}
function createMirror<T>(object: T): Mirror<T> {
  const m: Partial<Mirror<T>> = { [PROXY_SYM]: object }
  return {
    [PROXY_SYM]: object,
    [MIRROR_SYM]: m as Mirror<T>
  }
}

export function getObservable<T extends object>(proxied: T, prop: PropertyKey) { return proxied[MIRROR_SYM][prop] }
export function peek<T extends object>(proxied: T, prop: PropertyKey) { return getObservable(proxied, prop).peek() }
export function isProxied<T extends object>(proxied: T) { return PROXY_SYM in proxied }

Object.assign(proxy, { getObservable, peek, isProxied })
