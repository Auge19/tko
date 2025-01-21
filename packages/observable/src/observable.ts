//
//  Observable values
//  ---
//
import {
  options, overwriteLengthPropertyIfSupported
} from '@tko/utils'

import * as dependencyDetection from './dependencyDetection'
import { deferUpdates } from './defer'
import { defaultEvent, LATEST_VALUE, Subscribable } from './subscribable'
import { valuesArePrimitiveAndEqual } from './extenders'


export class Observable extends Subscribable {
  // Some observables may not always be writeable, notably computeds.
  isWriteable: true
  [key: symbol | string]: any;
  constructor(initialValue?: any) {
    super();
    this[options.protoProperty] = true
    if (arguments.length > 0) {
      // Write
      // Ignore writes if the value hasn't changed
      if (this.isDifferent(this[LATEST_VALUE], arguments[0])) {
        this.valueWillMutate();
        this[LATEST_VALUE] = arguments[0];
        this.valueHasMutated();
      }

    } else {
      // Read
      dependencyDetection.registerDependency(this) // The caller only needs to be notified of changes if they did a "read" operation
    }

    // overwriteLengthPropertyIfSupported(this, { value: undefined })

    if (options.deferUpdates) {
      deferUpdates(this)
    }

    this.equalityComparer = valuesArePrimitiveAndEqual
  }

  peek () { return this[LATEST_VALUE] }
  valueHasMutated () {
    this.notifySubscribers(this[LATEST_VALUE], 'spectate')
    this.notifySubscribers(this[LATEST_VALUE])
  }
  valueWillMutate () {
    this.notifySubscribers(this[LATEST_VALUE], 'beforeChange')
  }

  modify (fn, peek?) : Observable {

    if(peek === undefined)
      peek = true

    return this(fn(peek ? this.peek() : this()))
  }


}

// Moved out of "limit" to avoid the extra closure
function limitNotifySubscribers (value, event) {
  if (!event || event === defaultEvent) {
    this._limitChange(value)
  } else if (event === 'beforeChange') {
    this._limitBeforeChange(value)
  } else {
    this._origNotifySubscribers(value, event)
  }

}


// Add `limit` function to the subscribable prototype
Subscribable.prototype.limit = function limit (limitFunction) {
  var self = this
  var selfIsObservable = isObservable(self)
  var beforeChange = 'beforeChange'
  var ignoreBeforeChange, notifyNextChange, previousValue, pendingValue, didUpdate

  if (!self._origNotifySubscribers) {
    self._origNotifySubscribers = self.notifySubscribers
    self.notifySubscribers = limitNotifySubscribers
  }

  var finish = limitFunction(function () {
    self._notificationIsPending = false

    // If an observable provided a reference to itself, access it to get the latest value.
    // This allows computed observables to delay calculating their value until needed.
    if (selfIsObservable && pendingValue === self) {
      pendingValue = self._evalIfChanged ? self._evalIfChanged() : self()
    }
    const shouldNotify = notifyNextChange || (
      didUpdate && self.isDifferent(previousValue, pendingValue)
    )
    self._notifyNextChange = didUpdate = ignoreBeforeChange = false
    if (shouldNotify) {
      self._origNotifySubscribers(previousValue = pendingValue)
    }
  })

  Object.assign(self, {
    _limitChange  (value, isDirty) {
      if (!isDirty || !self._notificationIsPending) {
        didUpdate = !isDirty
      }
      self._changeSubscriptions = [...self._subscriptions[defaultEvent]]
      self._notificationIsPending = ignoreBeforeChange = true
      pendingValue = value
      finish()
    },

    _limitBeforeChange (value) {
      if (!ignoreBeforeChange) {
        previousValue = value
        self._origNotifySubscribers(value, beforeChange)
      }
    },

    _notifyNextChangeIfValueIsDifferent () {
      if (self.isDifferent(previousValue, self.peek(true /* evaluate */))) {
        notifyNextChange = true
      }
    },

    _recordUpdate () {
      didUpdate = true
    }
  })
}

/*
var protoProperty = observable.protoProperty = options.protoProperty
observable.fn[protoProperty] = observable

// Subclasses can add themselves to observableProperties so that
// isObservable will be `true`.
observable.
*/

export function isObservable (instance: any): instance is Observable {

  if(instance instanceof Observable)
    return true;

  const proto = typeof instance === 'function' && instance[options.protoProperty] === true
  // if (proto && !Observable.observablePrototypes.has(proto)) {
  //   throw Error('Invalid object that looks like an observable; possibly from another Knockout instance')
  // }
  return !!proto;
}

export function unwrap (value) {
  return isObservable(value) ? value() : value
}

export function peek (value) {
  return isObservable(value) ? value.peek() : value
}

export function isWriteableObservable<T = any> (instance: any): instance is Observable {
  return isObservable(instance) && (instance as any).isWriteable
}

export { isWriteableObservable as isWritableObservable }

export function observable(initialValue?: any): Observable {
  return new Observable(initialValue);
}
