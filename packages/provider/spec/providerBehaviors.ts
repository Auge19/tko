
import {
  Provider
} from '../src'

import { assert } from "chai";
import BindingHandlerObject from '../src/BindingHandlerObject';

describe('Provider', function () {
  it('throws an error if not subclassed', function () {
    const fn = () => new Provider()
    assert.throws(fn, /Provider is an abstract base class/)
  })

  it('throws an error FOR_NODE_TYPEs is missing', function () {
    class SubProvider extends Provider {}
    const fn = () => new SubProvider()
    assert.throws(fn, /must have FOR_NODE_TYPES/)
  })

  it('sets globals and bindingHandlers from params', function () {
    class SubProvider extends Provider {
      get FOR_NODE_TYPES () { return [] }
    }
    const globals = {}
    const bindingHandlers = {} as BindingHandlerObject
    const sp = new SubProvider({ globals, bindingHandlers })
    assert.strictEqual(sp.globals, globals)
    assert.strictEqual(sp.bindingHandlers, bindingHandlers)
  })
})
