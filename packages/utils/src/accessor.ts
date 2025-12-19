export function access<T>(x: MaybeAccessor<T>): T {
    return isAccessor(x) ? x() : x
}
export function isAccessor<T = any>(x: any): x is Accessor<T> {
    return typeof x === 'function'
}
export type Accessor<T = any> = () => T;
export type MaybeAccessor<T = any> = Accessor<T> | T;