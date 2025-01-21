//
// Observable Arrays
// ===
//
import {
    arrayIndexOf, arrayForEach, overwriteLengthPropertyIfSupported
} from '@tko/utils'

import { Observable, isObservable, } from './observable'

import { trackArrayChanges } from './observableArray.changeTracking'

export interface ObservableArrayFunctions extends Observable {
  //#region observableArray/generalFunctions
  /**
    * Returns the index of the first occurrence of a value in an array.
    * @param searchElement The value to locate in the array.
    * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
    */
  indexOf(searchElement: any, fromIndex?: number): number;

  /**
    * Returns a section of an array.
    * @param start The beginning of the specified portion of the array.
    * @param end The end of the specified portion of the array. If omitted, all items after start are included
    */
  slice(start: number, end?: number): any[];

  /**
   * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
   * @param start The zero-based location in the array from which to start removing elements.
   * @param deleteCount The number of elements to remove. Defaults to removing everything after `start`
   * @param items Elements to insert into the array in place of the deleted elements.
   */
  splice(start: number, deleteCount?: number, ...items: any[]): any[];

  /**
   * Removes the last value from the array and returns it.
   */
  pop(): any;
  /**
   * Adds a new item to the end of array.
   * @param items Items to be added
   */
  push(...items: any[]): number;
  /**
   * Removes the first value from the array and returns it.
   */
  shift(): any;
  /**
   * Inserts a new item at the beginning of the array.
   * @param items Items to be added
   */
  unshift(...items: any[]): number;

  /**
   * Reverses the order of the array and returns the observableArray.
   * Modifies the underlying array.
   */
  reverse(): this;

  /**
   * Sorts the array contents and returns the observableArray.
   * Modifies the underlying array.
   */
  sort(compareFunction?: (left: any, right: any) => number): this;
  //#endregion

  //#region observableArray/koSpecificFunctions
  /**
   * Returns a reversed copy of the array.
   * Does not modify the underlying array.
   */
  reversed(): any[];

  /**
   * Returns a reversed copy of the array.
   * Does not modify the underlying array.
   */
  sorted(compareFunction?: (left: any, right: any) => number): any[];
  /**
   * Replaces the first value that equals oldItem with newItem
   * @param oldItem Item to be replaced
   * @param newItem Replacing item
   */
  replace(oldItem: any, newItem: any): void;

  /**
   * Removes all values that equal item and returns them as an array.
   * @param item The item to be removed
   */
  remove(item: any): any[];
  /**
   * Removes all values  and returns them as an array.
   * @param removeFunction A function used to determine true if item should be removed and fasle otherwise
   */
  remove(removeFunction: (item: any) => boolean): any[];

  /**
   * Removes all values and returns them as an array.
   */
  removeAll(): any[];
  /**
   * Removes all values that equal any of the supplied items
   * @param items Items to be removed
   */
  removeAll(items: any[]): any[];

  // Ko specific Usually relevant to Ruby on Rails developers only
  /**
   * Finds any objects in the array that equal someItem and gives them a special property called _destroy with value true.
   * Usually only relevant to Ruby on Rails development
   * @param item Items to be marked with the property.
   */
  destroy(item: any): void;
  /**
   * Finds any objects in the array filtered by a function and gives them a special property called _destroy with value true.
   * Usually only relevant to Ruby on Rails development
   * @param destroyFunction A function used to determine which items should be marked with the property.
   */
  destroy(destroyFunction: (item: any) => boolean): void;

  /**
   * Gives a special property called _destroy with value true to all objects in the array.
   * Usually only relevant to Ruby on Rails development
   */
  destroyAll(): void;
  /**
   * Finds any objects in the array that equal supplied items and gives them a special property called _destroy with value true.
   * Usually only relevant to Ruby on Rails development
   * @param items
   */
  destroyAll(items: any[]): void;
  //#endregion
}

export interface ObservableArray extends Observable, ObservableArrayFunctions {
  (value: any[] | null | undefined): this;
}

export function observableArray(initialValues?: any[]): ObservableArray {
  initialValues = initialValues || []

  if (typeof initialValues !== 'object' || !('length' in initialValues)) { throw new Error('The argument passed when initializing an observable array must be an array, or null, or undefined.') }

  var result = Object.setPrototypeOf(new Observable(initialValues), observableArray.fn) as any
  trackArrayChanges(result)
        // ^== result.extend({ trackArrayChanges: true })
  overwriteLengthPropertyIfSupported(result, { get: () => result()?.length })
  return result
}

export function isObservableArray (instance: { remove: any; push: any }) {
  return isObservable(instance) && typeof instance.remove === 'function' && typeof instance.push === 'function'
}

observableArray.fn = {
  remove (valueOrPredicate: any): any[] {
    var underlyingArray = this.peek()
    var removedValues = new Array()
    var predicate = typeof valueOrPredicate === 'function' && !isObservable(valueOrPredicate) ? valueOrPredicate : function (value: any) { return value === valueOrPredicate }
    for (var i = 0; i < underlyingArray.length; i++) {
      var value = underlyingArray[i]
      if (predicate(value)) {
        if (removedValues.length === 0) {
          this.valueWillMutate()
        }
        if (underlyingArray[i] !== value) {
          throw Error("Array modified during remove; cannot remove item")
        }
        removedValues.push(value)
        underlyingArray.splice(i, 1)
        i--
      }
    }
    if (removedValues.length) {
      this.valueHasMutated()
    }
    return removedValues
  },

  removeAll (arrayOfValues: undefined): any {
        // If you passed zero args, we remove everything
    if (arrayOfValues === undefined) {
      var underlyingArray = this.peek()
      var allValues = underlyingArray.slice(0)
      this.valueWillMutate()
      underlyingArray.splice(0, underlyingArray.length)
      this.valueHasMutated()
      return allValues
    }
        // If you passed an arg, we interpret it as an array of entries to remove
    if (!arrayOfValues) {
      return []
    }
    return this['remove'](function (value: any) {
      return arrayIndexOf(arrayOfValues, value) >= 0
    })
  },

  destroy (valueOrPredicate: any): void {
    var underlyingArray = this.peek()
    var predicate = typeof valueOrPredicate === 'function' && !isObservable(valueOrPredicate) ? valueOrPredicate : function (value: any) { return value === valueOrPredicate }
    this.valueWillMutate()
    for (var i = underlyingArray.length - 1; i >= 0; i--) {
      var value = underlyingArray[i]
      if (predicate(value)) {
        value['_destroy'] = true
      }
    }
    this.valueHasMutated()
  },

  destroyAll (arrayOfValues: undefined): any {
        // If you passed zero args, we destroy everything
    if (arrayOfValues === undefined) { return this.destroy(function () { return true }) }

        // If you passed an arg, we interpret it as an array of entries to destroy
    if (!arrayOfValues) {
      return []
    }
    return this.destroy(function (value: any) {
      return arrayIndexOf(arrayOfValues, value) >= 0
    })
  },

  indexOf (item: any): number {
    return arrayIndexOf(this(), item)
  },

  replace (oldItem: any, newItem: any): void {
    var index = this.indexOf(oldItem)
    if (index >= 0) {
      this.valueWillMutate()
      this.peek()[index] = newItem
      this.valueHasMutated()
    }
  },

  sorted (compareFn: ((a: any, b: any) => number) | undefined): any[] {
    return [...this()].sort(compareFn)
  },

  reversed (): any[] {
    return [...this()].reverse()
  },

  [Symbol.iterator]: function * (): Generator<any, void, any> {
    yield * this()
  }
}



Object.setPrototypeOf(observableArray.fn, observable.fn)

// Populate ko.observableArray.fn with read/write functions from native arrays
// Important: Do not add any additional functions here that may reasonably be used to *read* data from the array
// because we'll eval them without causing subscriptions, so ko.computed output could end up getting stale
arrayForEach(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function (methodName: string | number) {
  observableArray.fn[methodName] = function () {
        // Use "peek" to avoid creating a subscription in any computed that we're executing in the context of
        // (for consistency with mutating regular observables)
    var underlyingArray = this.peek()
    this.valueWillMutate()
    this.cacheDiffForKnownOperation(underlyingArray, methodName, arguments)
    var methodCallResult = underlyingArray[methodName].apply(underlyingArray, arguments)
    this.valueHasMutated()
        // The native sort and reverse methods return a reference to the array, but it makes more sense to return the observable array instead.
    return methodCallResult === underlyingArray ? this : methodCallResult
  }
})

// Populate ko.observableArray.fn with read-only functions from native arrays
arrayForEach(['slice'], function (methodName: string | number) {
  observableArray.fn[methodName] = function () {
    var underlyingArray = this()
    return underlyingArray[methodName].apply(underlyingArray, arguments)
  }
})

// Expose for testing.
observableArray.trackArrayChanges = trackArrayChanges
