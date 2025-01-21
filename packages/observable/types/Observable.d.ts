//#region Subscribable

/*
export type SubscriptionCallback<T = any, TTarget = void> = (this: TTarget, val: T) => void;
export type MaybeSubscribable<T = any> = T | Subscribable<T>;

type Flatten<T> = T extends Array<infer U> ? U : T;

export interface SubscribableFunctions<T = any> extends Function {
    init<S extends Subscribable<any>>(instance: S): void;

    notifySubscribers(valueToWrite?: any, event?: string): void;

    subscribe<TTarget = void>(callback: SubscriptionCallback<utils.ArrayChanges<Flatten<T>>, TTarget>, callbackTarget: TTarget, event: "arrayChange"): Subscription;

    subscribe<TTarget = void>(callback: SubscriptionCallback<T, TTarget>, callbackTarget: TTarget, event: "beforeChange" | "spectate" | "awake"): Subscription;
    subscribe<TTarget = void>(callback: SubscriptionCallback<undefined, TTarget>, callbackTarget: TTarget, event: "asleep"): Subscription;
    subscribe<TTarget = void>(callback: SubscriptionCallback<T, TTarget>, callbackTarget?: TTarget, event?: "change"): Subscription;
    subscribe<X = any, TTarget = void>(callback: SubscriptionCallback<X, TTarget>, callbackTarget: TTarget, event: string): Subscription;

    extend(requestedExtenders: ObservableExtenderOptions<T>): this;
    extend<S extends Subscribable<T>>(requestedExtenders: ObservableExtenderOptions<T>): S;

    getSubscriptionsCount(event?: string): number;

    // TKO

    when(test, returnValue?)
}

export interface Subscribable<T = any> extends SubscribableFunctions<T> { }

export const subscribable: {
    new <T = any>(): Subscribable<T>;
    fn: SubscribableFunctions;
};

export function isSubscribable<T = any>(instance: any): instance is Subscribable<T>;


//#endregion


//#region Observable 

export type MaybeObservable<T = any> = T | Observable<T>;


export function observable<T>(value: T): Observable<T>;
export function observable<T = any>(value: null): Observable<T | null>

*/
/** No initial value provided, so implicitly includes `undefined` as a possible value */
/*
export function observable<T = any>(): Observable<T | undefined>
export module observable {
    export const fn: ObservableFunctions;
}

export function isObservable<T = any>(instance: any): instance is Observable<T>;

export function isWriteableObservable<T = any>(instance: any): instance is Observable<T>;
export function isWritableObservable<T = any>(instance: any): instance is Observable<T>;

//#endregion Observable 

//#region ObservableArray

export type MaybeObservableArray<T = any> = T[] | ObservableArray<T>;

*/
//#endregion ObservableArray