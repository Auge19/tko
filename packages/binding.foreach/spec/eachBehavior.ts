/*

  Knockout Each --- Tests

 */

import {
  removeNode, arrayForEach, options, domData
} from '@tko/utils'

import {
  observable, observableArray, isObservable
} from '@tko/observable'

import {
  computed
} from '@tko/computed'

import {
  contextFor, dataFor, applyBindings
} from '@tko/bind'

import { DataBindProvider } from '@tko/provider.databind'
import { VirtualProvider } from '@tko/provider.virtual'
import { MultiProvider } from '@tko/provider.multi'

import {
  bindings as coreBindings
} from '@tko/binding.core'

import {
  ForEachBinding
} from '../dist/foreach'

import $ from 'jquery'

import { assert } from "chai"
import { ObservableArray } from 'packages/observable/types/Observable'

beforeEach(function () {
  const provider = new MultiProvider({
    providers: [new DataBindProvider(), new VirtualProvider()]
  })
  options.bindingProviderInstance = provider
  provider.bindingHandlers.set(coreBindings)
  provider.bindingHandlers.set({ foreach: ForEachBinding })
  // provider.bindingHandlers.set(ifBindings);
})

beforeEach(function () {
  ForEachBinding.setSync(true)
})

describe('each binding', function () {
  it('works with a static list', function () {
    const target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>")
    const list = [1, 2, 3]
    applyBindings(list, target[0])
    assert.equal($(target).find('li').length, 3)
  })

  it('works with an observable array', function () {
    const target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>")
    const list = [1, 2, 3]
    applyBindings(observableArray(list), target[0])
    assert.equal($(target).find('li').length, 3)
  })

  it('works with a plain observable with an array', function () {
    const target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>")
    const list = [1, 2, 3]
    applyBindings(observable(list), target[0])
    assert.equal($(target).find('li').length, 3)
  })

  it('works with a computed observable', function () {
    const target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>")
    const list = [1, 2, 3]
    applyBindings(computed({read: function () { return list }}), target[0])
    assert.equal($(target).find('li').length, 3)
  })

  it('processes initial data synchronously', function () {
    ForEachBinding.setSync(false)
    const target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>")
    const list = [1, 2, 3]
    applyBindings(computed({ read: function () { return list } }), target[0])
    assert.equal($(target).find('li').length, 3)
  })

  it('processes initial data synchronously but is later asynchronous', function () {
    ForEachBinding.setSync(false)
    // reset to the default async animateFrame
    // foreac
    const target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>")
    const list = observableArray([1, 2, 3])
    applyBindings(list, target[0])
    assert.equal($(target).find('li').length, 3)

    list.push(4)
    assert.equal($(target).find('li').length, 3)

    // TODO: add logic to test if the update really happened
  })

  it('applies bindings to the immediate child', function () {
    const target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>")
    const list = ['a', 'b', 'c']
    applyBindings(list, target[0])
    assert.equal($(target).find('li').text(), 'abc')
  })

  it('applies to inner children', function () {
    const target = $("<ul data-bind='foreach: $data'><li><em data-bind='text: $data'></em></li></div>")
    const list = ['a', 'b', 'c']
    applyBindings(list, target[0])
    assert.equal($(target).html(), '<li><em data-bind="text: $data">a</em></li>' +
                                   '<li><em data-bind="text: $data">b</em></li>' +
                                   '<li><em data-bind="text: $data">c</em></li>')
  })

  it('works with virtual elements', function () {
    const target = $("<div><!-- ko foreach: $data --><em data-bind='text: $data'></em><!-- /ko --></div>")
    const list = ['A', 'B']
    applyBindings(list, target[0])
    assert.equal($(target).html(), '<!-- ko foreach: $data -->' +
                                   '<em data-bind="text: $data">A</em>' +
                                   '<em data-bind="text: $data">B</em>' +
                                   '<!-- /ko -->')
  })

  it('bindings only inner (virtual) element', function () {
    const target = $("<ul data-bind='foreach: $data'><!-- ko text: $data -->Z<!-- /ko --></ul>")
    const list = ['E', 'V']
    applyBindings(list, target[0])
    assert.equal(target.html(), '<!-- ko text: $data -->E<!-- /ko -->' +
                                '<!-- ko text: $data -->V<!-- /ko -->')
  })

  it('bindings mixed inner virtual elements', function () {
    const target = $("<ul data-bind='foreach: $data'>Q<!-- ko text: $data -->Z2<!-- /ko -->R</ul>")
    const list = ['E2', 'V2']
    applyBindings(list, target[0])
    assert.equal(target.html(), 'Q<!-- ko text: $data -->E2<!-- /ko -->R' +
                                'Q<!-- ko text: $data -->V2<!-- /ko -->R')
  })

  it('uses the name/id of a <template>', function () {
    const target = $("<ul data-bind='foreach: {name: \"tID\", data: $data}'>Zee</ul>")
    const list = ['F1', 'F2']
    const $template = $("<template id='tID'>X<!-- ko text: $data--><!--/ko--></template>")
      .appendTo(document.body)
    applyBindings(list, target[0])
    assert.equal(target.html(), 'X<!-- ko text: $data-->F1<!--/ko-->' +
                                'X<!-- ko text: $data-->F2<!--/ko-->')
    $template.remove()
  })

  it('uses the name/id of a <script>', function () {
    const target = $("<ul data-bind='foreach: {name: \"tID\", data: $data}'>Zee</ul>")
    const list = ['G1', 'G2']
    const $template = $("<script type='text/ko-template' id='tID'></script>")
      .appendTo(document.body)
    $template.text('Y<!-- ko text: $data--><!--/ko-->')
    applyBindings(list, target[0])
    assert.equal(target.html(), 'Y<!-- ko text: $data-->G1<!--/ko-->' +
                                'Y<!-- ko text: $data-->G2<!--/ko-->')
    $template.remove()
  })

  it('uses the name/id of a <div>', function () {
    const target = $("<ul data-bind='foreach: {name: \"tID2\", data: $data}'>Zee</ul>")
    const list = ['H1', 'H2']
    const $template = $("<div id='tID2'>Z<!-- ko text: $data--><!--/ko--></div>")
      .appendTo(document.body)
    applyBindings(list, target[0])
    assert.equal(target.html(), 'Z<!-- ko text: $data-->H1<!--/ko-->' +
                                'Z<!-- ko text: $data-->H2<!--/ko-->')
    $template.remove()
  })
})

describe('is empty/conditional', function () {
  it('sets `elseChainSatisfied` to false for an empty array', function () {
    const div = $("<div data-bind='foreach: obs'><i data-bind='text: $data'></i></div>")
    const obs = new Array()
    const view = {obs: obs}
    applyBindings(view, div[0])
    assert.equal(domData.get(div[0], 'conditional').elseChainSatisfied(), false)
  })

  it('sets `elseChainSatisfied` to false for an undefined obs array', function () {
    const div = $("<div data-bind='foreach: obs'><i data-bind='text: $data'></i></div>")
    const obs = observableArray()
    const view = {obs: obs}
    applyBindings(view, div[0])
    assert.equal(domData.get(div[0], 'conditional').elseChainSatisfied(), false)
  })

  it('sets `elseChainSatisfied` to false for an empty obs array', function () {
    const div = $("<div data-bind='foreach: obs'><i data-bind='text: $data'></i></div>")
    const obs = observableArray([])
    const view = {obs: obs}
    applyBindings(view, div[0])
    assert.equal(domData.get(div[0], 'conditional').elseChainSatisfied(), false)
  })

  it('sets `elseChainSatisfied` to true for a non-empty array', function () {
    const div = $("<div data-bind='foreach: obs'><i data-bind='text: $data'></i></div>")
    const obs = [1, 2, 3]
    const view = {obs: obs}
    applyBindings(view, div[0])
    assert.equal(domData.get(div[0], 'conditional').elseChainSatisfied(), true)
  })

  it('sets `elseChainSatisfied` to true for a non-empty obs array', function () {
    const div = $("<div data-bind='foreach: obs'><i data-bind='text: $data'></i></div>")
    const obs = observableArray([1, 2, 3])
    const view = {obs: obs}
    applyBindings(view, div[0])
    assert.equal(domData.get(div[0], 'conditional').elseChainSatisfied(), true)
  })

  it('sets `elseChainSatisfied` to true after array is filled', function () {
    const div = $("<div data-bind='foreach: obs'><i data-bind='text: $data'></i></div>")
    const obs: ObservableArray<number> = observableArray([])
    const view = {obs: obs}
    applyBindings(view, div[0])
    obs([1, 2, 3])
    assert.equal(domData.get(div[0], 'conditional').elseChainSatisfied(), true)
  })

  it('sets `elseChainSatisfied` to false after array is emptied', function () {
    const div = $("<div data-bind='foreach: obs'><i data-bind='text: $data'></i></div>")
    const obs = observableArray([1, 2, 3])
    const view = {obs: obs}
    applyBindings(view, div[0])
    obs([])
    assert.equal(domData.get(div[0], 'conditional').elseChainSatisfied(), false)
  })
})

describe('observable array changes', function () {
  let div, obs, view

  beforeEach(function () {
    div = $("<div data-bind='foreach: obs'><i data-bind='text: $data'></i></div>")
    obs = observableArray()
    view = {obs: obs}
  })

  it('adds an item to an empty list', function () {
    applyBindings(view, div[0])
    obs(['a'])
    assert.equal(div.text(), 'a')
  })

  it('adds an item to the end of a pre-existing list', function () {
    obs(['a'])
    applyBindings(view, div[0])
    obs.push('b')
    assert.equal(div.text(), 'ab')
  })

  it('adds an item to the beginning of a pre-existing list', function () {
    obs(['a'])
    applyBindings(view, div[0])
    obs.unshift('b')
    assert.equal(div.text(), 'ba')
  })

  it('adds an item to the middle of a pre-existing list', function () {
    obs(['a', 'b'])
    applyBindings(view, div[0])
    obs.splice(1, 0, 'c')
    assert.equal(div.text(), 'acb')
  })

  it('splices items at the beginning of a pre-existing list', function () {
    obs(['a', 'b', 'c'])
    applyBindings(view, div[0])
    obs.splice(0, 1, 'd')
    assert.equal(div.text(), 'dbc')
  })

  it('removes items at the middle of a pre-existing list', function () {
    obs(['a', 'b', 'c'])
    applyBindings(view, div[0])
    obs.splice(0, 1)
    assert.equal(div.text(), 'bc')
  })

  it('splices items at the middle of a pre-existing list', function () {
    obs(['a', 'b', 'c'])
    applyBindings(view, div[0])
    obs.splice(1, 1, 'D')
    assert.equal(div.text(), 'aDc')
  })

  it('splices items at the end of a pre-existing list', function () {
    obs(['a', 'b', 'c'])
    applyBindings(view, div[0])
    obs.splice(2, 1, 'D')
    assert.equal(div.text(), 'abD')
  })

  it('deletes the last item', function () {
    obs(['a'])
    applyBindings(view, div[0])
    obs([])
    assert.equal(div.text(), '')
  })

  it('deletes text nodes', function () {
    div = $("<div data-bind='foreach: obs'>x<i data-bind='text: $data'></i>y</div>")
    applyBindings(view, div[0])
    obs(['a', 'b', 'c'])
    assert.equal(div.text(), 'xayxbyxcy')
    obs(['a', 'c'])
    assert.equal(div.text(), 'xayxcy')
    obs(['a'])
    assert.equal(div.text(), 'xay')
    obs([])
    assert.equal(div.text(), '')
  })

  it('deletes from virtual elements', function () {
    div = $('<div>')
    div.append(document.createComment('ko foreach: obs'))
    div.append($("<i data-bind='text: $data'></i>")[0])
    div.append(document.createComment('/ko'))
    applyBindings(view, div[0])
    obs(['a', 'b', 'c'])
    assert.equal(div.text(), 'abc')
    obs(['a', 'c'])
    assert.equal(div.text(), 'ac')
    obs(['a'])
    assert.equal(div.text(), 'a')
    obs([])
    assert.equal(div.text(), '')
    obs(['a', 'b'])
    assert.equal(div.text(), 'ab')
    obs([])
    assert.equal(div.text(), '')
    obs(['a', 'b', 'c'])
    assert.equal(div.text(), 'abc')
    obs(['a'])
    assert.equal(div.text(), 'a')
    obs(['a', 'b', 'c'])
    assert.equal(div.text(), 'abc')
    obs(['c'])
    assert.equal(div.text(), 'c')
  })

  it('deletes from the beginning / shift', function () {
    obs(['a', 'b', 'c'])
    applyBindings(view, div[0])
    obs.shift()
    assert.equal(div.text(), 'bc')
  })

  it('deletes from the beginning / pop', function () {
    obs(['a', 'b', 'c'])
    applyBindings(view, div[0])
    obs.pop()
    assert.equal(div.text(), 'ab')
  })

  it('combines multiple adds and deletes', function () {
    obs(['A', 'B', 'C', 'D', 'E', 'F'])
    applyBindings(view, div[0])
    obs(['x', 'B', 'C', 'D', 'z', 'F'])
    assert.equal(div.text(), 'xBCDzF')
  })

  it('processes multiple deletes', function () {
    // Per issue #6
    applyBindings(view, div[0])
    obs([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    assert.equal(div.text(), '0123456789')
    obs([1, 2, 3, 4, 5, 6, 7, 8])
    assert.equal(div.text(), '12345678')
    obs([2, 3, 4, 5, 6, 7, 8, 9])
    assert.equal(div.text(), '23456789')
    obs([3, 4, 5, 6, 7, 8, 9])
    assert.equal(div.text(), '3456789')
    obs([2, 3, 4, 5, 6, 7, 8, 9])
    assert.equal(div.text(), '23456789')
    obs([6, 7, 8, 9])
    assert.equal(div.text(), '6789')
    obs([1, 2, 3, 6, 7, 8])
    assert.equal(div.text(), '123678')
    obs([0, 1, 2, 3, 4])
    assert.equal(div.text(), '01234')
    obs([1, 2, 3, 4])
    assert.equal(div.text(), '1234')
    obs([3, 4])
    assert.equal(div.text(), '34')
    obs([3])
    assert.equal(div.text(), '3')
    obs([])
    assert.equal(div.text(), '')
  })

  it('processes numerous changes', function () {
    applyBindings(view, div[0])
    obs([5, 6, 7, 8, 9])
    assert.equal(div.text(), '56789')
    obs([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    assert.equal(div.text(), '0123456789')
    obs(['a', 'b', 'c'])
    assert.equal(div.text(), 'abc')
  })

  it('processes numerous changes with splice', function () {
    applyBindings(view, div[0])
    obs([5, 6, 7, 8, 9])
    assert.equal(div.text(), '56789')
    obs.splice(1, 2, 16, 17)
    assert.equal(div.text(), '5161789')
    obs.splice(0, 5, 'a', 'b', 'c')
    assert.equal(div.text(), 'abc')
  })

  it('accepts changes via a computed observable', function () {
    const target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>")
    const toggle = observable(true)
    const list1 = [1, 2, 3]
    const list2 = [1, 2, 3, 4, 5, 6]
    applyBindings(computed({
      read: function () { return toggle() ? list1 : list2 }
    }), target[0])
    assert.equal(target.text(), '123')
    toggle(false)
    assert.equal(target.text(), '123456')
  })

  describe('DOM move capabilities', function () {
    it('sorting complex data moves 1 DOM node', function () {
      div = $("<div data-bind='foreach: obs'><div data-bind='html: testHtml'></div></div>")
      applyBindings(view, div[0])
      obs([{ id: 4, testHtml: '<span>A</span>' }, { id: 6, testHtml: '<span>B</span>' }, { id: 1, testHtml: '<span>C</span>' }])
      const nodes = div.children().toArray()
      assert.equal(div.text(), 'ABC')
      obs.sort(function (a, b) { return a.id - b.id })
      const nodes2 = div.children().toArray()
      assert.strictEqual(nodes[1], nodes2[2])
      assert.strictEqual(nodes[2], nodes2[0])
      assert.strictEqual(nodes[0], nodes2[1])
      assert.equal(div.text(), 'CAB')
    })

    it('sorting complex data moves all DOM nodes', function () {
      div = $("<div data-bind='foreach: obs'><div data-bind='html: testHtml'></div></div>")
      applyBindings(view, div[0])
      obs([{ id: 7, testHtml: '<span>A</span>' }, { id: 6, testHtml: '<span>B</span>' }, { id: 1, testHtml: '<span>C</span>' }, { id: 9, testHtml: '<span>D</span>' }])
      const nodes = div.children().toArray()
      assert.equal(div.text(), 'ABCD')
      obs.reverse()
      const nodes2 = div.children().toArray()
      assert.strictEqual(nodes[0], nodes2[3])
      assert.strictEqual(nodes[1], nodes2[2])
      assert.strictEqual(nodes[2], nodes2[1])
      assert.strictEqual(nodes[3], nodes2[0])
      assert.equal(div.text(), 'DCBA')
    })

    it('sorting complex data recreates DOM nodes if move disabled', function () {
      const originalShouldDelayDeletion = ForEachBinding.prototype.shouldDelayDeletion
      ForEachBinding.prototype.shouldDelayDeletion = function (/* data */) { return false }
      div = $("<div data-bind='foreach: { data: obs }'><div data-bind='html: testHtml'></div></div>")
      applyBindings(view, div[0])
      obs([{ id: 7, testHtml: '<span>A</span>' }, { id: 6, testHtml: '<span>B</span>' }, { id: 1, testHtml: '<span>C</span>' }])
      const nodes = div.children().toArray()
      assert.equal(div.text(), 'ABC')
      obs.sort(function (a, b) { return a.id - b.id })
      const nodes2 = div.children().toArray()
      assert.equal(div.text(), 'CBA')
      assert.notStrictEqual(nodes[1], nodes2[2])
      assert.notStrictEqual(nodes[2], nodes2[0])
      assert.notStrictEqual(nodes[0], nodes2[1])
      ForEachBinding.prototype.shouldDelayDeletion = originalShouldDelayDeletion
    })

    it('Sort large complex array makes correct DOM moves', function () {
      const itemNumber = 100
      div = $("<div data-bind='foreach: { data: obs }'><div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div></div></div>")
      applyBindings(view, div[0])
      let arr = new Array(), i
      for (i = 0; i != itemNumber; ++i) {
        arr.push({ id: Math.floor(Math.random() * itemNumber), testHtml: '<span>Item ' + i + '</span>' })
      }
      obs(arr)
      assert.equal(div.children().length, itemNumber)
      div.children().prop('testprop', 10)
      // console.time("with move");
      obs.sort(function (a, b) { return a.id - b.id })
      // console.timeEnd("with move");
      for (i = 0; i != itemNumber; ++i) {
        arr[i].num = i
      }
      assert.equal(div.children().length, itemNumber)
      assert.equal(div.children().filter(function () { return this.testprop == 10 }).length, itemNumber)
      div.children().each(function (index) {
        assert.equal(index, dataFor(this).num)
      })
    })

    it('Sort large complex array makes correct DOM order without move', function () {
      const originalShouldDelayDeletion = ForEachBinding.prototype.shouldDelayDeletion
      ForEachBinding.prototype.shouldDelayDeletion = function (/* data */) { return false }
      const itemNumber = 100
      div = $("<div data-bind='foreach: { data: obs }'><div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div></div></div>")
      applyBindings(view, div[0])
      let arr = new Array(), i
      for (i = 0; i != itemNumber; ++i) {
        arr.push({ id: Math.floor(Math.random() * itemNumber), testHtml: '<span>Item ' + i + '</span>' })
      }
      obs(arr)
      assert.equal(div.children().length, itemNumber)
      obs.sort(function (a, b) { return a.id - b.id })
      for (i = 0; i != itemNumber; ++i) {
        arr[i].num = i
      }
      assert.equal(div.children().length, itemNumber)
      div.children().each(function (index) {
        assert.equal(index, dataFor(this).num)
      })
      ForEachBinding.prototype.shouldDelayDeletion = originalShouldDelayDeletion
    })

    it('processes duplicate data 1', function () {
      div = $("<div data-bind='foreach: obs'><div data-bind='html: testHtml'></div></div>")
      applyBindings(view, div[0])
      const itemA = { id: 4, testHtml: '<span>A</span>' }
      const itemB = { id: 6, testHtml: '<span>B</span>' }
      obs([itemB, itemA, itemA, itemA])
      const nodes = div.children().toArray()
      assert.equal(div.text(), 'BAAA')
      obs([itemA, itemB])
      const nodes2 = div.children().toArray()
      assert.strictEqual(nodes[3], nodes2[0])
      assert.strictEqual(nodes[0], nodes2[1])
      assert.equal(div.text(), 'AB')
    })

    it('processes duplicate data 2', function () {
      div = $("<div data-bind='foreach: obs'><div data-bind='html: testHtml'></div></div>")
      applyBindings(view, div[0])
      const itemA = { id: 4, testHtml: '<span>A</span>' }
      const itemB = { id: 6, testHtml: '<span>B</span>' }
      const others = [1, 2, 3, 4].map(function (e) { return { id: e, testHtml: '' } })
      obs([itemB, others[0], others[1], others[2], others[3], itemA, itemA])
      // var nodes =
      div.children().each(function () { this.test = 1 }).toArray()
      assert.equal(div.text(), 'BAA')
      obs([itemB, itemA, itemA, itemA, itemA, others[0], others[1], others[2], others[3]])
      // var nodes2 =
      div.children().toArray()
      // reuses two 'A' node set
      assert.equal(div.children().filter(function () { return this.test == 1 }).length, 7)
      // ... and creates two new
      assert.equal(div.children().filter(function () { return this.test === undefined }).length, 2)
      assert.equal(div.text(), 'BAAAA')
    })

    it('processes changes from more changesets 1', function () {
      const originalAnimateFrame = ForEachBinding.animateFrame
      ForEachBinding.animateFrame = function () { }
      ForEachBinding.setSync(false)
      div = $("<div data-bind='visible: true'></div>")
      applyBindings({}, div[0])

      const itemA = { id: 4, testHtml: '<span>A</span>' }
      const others = [11, 12, 13, 14].map(function (e) { return { id: e, testHtml: 'C' + e } })
      obs([itemA, others[0], others[1], others[2], others[3]])

      // manual initialization to be able to access processQueue method
      const ffe = new ForEachBinding({
        $element: div[0],
        $context: contextFor(div[0]),
        allBindings: { get () {} },
        valueAccessor () {
          return {
            data: obs,
            templateNode: $("<template><div data-bind='html: testHtml'></div></template>")[0]
          }
        }
      })

      ffe.processQueue()
      // var nodes =
      div.children().each(function () { this.test = 1 }).toArray()
      assert.equal(div.text(), 'AC11C12C13C14')
      obs([others[0], others[1], others[2], others[3], itemA])
      obs([others[1], itemA, others[2], others[3]])
      obs.sort(function (a, b) { return b.id - a.id })
      assert.equal(div.text(), 'AC11C12C13C14')

      ffe.processQueue()
      assert.equal(div.text(), 'C14C13C12A')
      // moved all five nodes around
      assert.equal(div.children().filter(function () { return this.test == 1 }).length, 4)
      ForEachBinding.animateFrame = originalAnimateFrame
    })

    it('processes changes from more changesets 2', function () {
      const originalAnimateFrame = ForEachBinding.animateFrame
      ForEachBinding.animateFrame = function () { }
      ForEachBinding.setSync(false)
      div = $("<div data-bind='visible: true'></div>")
      applyBindings({}, div[0])

      const itemA = { id: 4, testHtml: '<span>A</span>' }
      const itemB = { id: 5, testHtml: '<span>B</span>' }
      obs([itemA, itemB])

      // manual initialization to be able to access processQueue method
      const ffe = new ForEachBinding({
        $element: div[0],
        valueAccessor () {
          return {
            data: obs,
            templateNode: $("<script type='text/html'><div data-bind='html: testHtml'></div></script>")[0]
          }
        },
        allBindings: { get () {} },
        $context: contextFor(div[0])
      })

      ffe.processQueue()
      // var nodes =
      div.children().each(function () { this.test = 1 }).toArray()
      assert.equal(div.text(), 'AB')
      obs.remove(itemB)
      obs.push(itemB)
      obs.remove(itemB)
      obs.push(itemB)
      obs.remove(itemB)
      obs.push(itemB)
      assert.equal(div.text(), 'AB')

      ffe.processQueue()
      assert.equal(div.text(), 'AB')
      assert.equal(div.children().filter(function () { return this.test === 1 }).length, 2)
      ForEachBinding.animateFrame = originalAnimateFrame
    })

    it('cleans data objects', function () {
      div = $("<div data-bind='foreach: obs'><div data-bind='html: testHtml'></div></div>")
      applyBindings(view, div[0])
      const itemA = { id: 4, testHtml: '<span>A</span>' }
      const itemB = { id: 6, testHtml: '<span>B</span>' }
      const itemC = { id: 6, testHtml: '<span>C</span>' }
      obs([itemA, itemB, itemC, itemA])
      const nodes = div.children().toArray()
      assert.equal(div.text(), 'ABCA')
      obs([itemC, itemA, itemB])
      const nodes2 = div.children().toArray()
      assert.equal(itemA[ForEachBinding.PENDING_DELETE_INDEX_SYM], undefined)
      assert.equal(itemB[ForEachBinding.PENDING_DELETE_INDEX_SYM], undefined)
      assert.equal(itemC[ForEachBinding.PENDING_DELETE_INDEX_SYM], undefined)
      assert.equal(nodes[0], nodes2[1])
      assert.equal(div.text(), 'CAB')
    })
  })

  describe('afterAdd', function () {
    it('emits on changes to an observable array', function () {
      let calls = 0
      let nodes = 0
      const arr: ObservableArray = observableArray([])
      function cb (v) { calls++; nodes += v.nodeOrArrayInserted.length }
      const target = $("<ul data-bind='foreach: { data: arr, afterAdd: cb }'><li data-bind='text: $data'></li></div>")
      applyBindings({arr: arr, cb: cb}, target[0])
      assert.equal(calls, 0)
      assert.equal(nodes, 0)
      arr.push('x')
      assert.equal(calls, 1)
      assert.equal(nodes, 1)
      arr([2, 3, 4])
      assert.equal(calls, 2)
      assert.equal(nodes, 4, 'n4')
    })

    it('is called with initial data', function () {
      let calls = 0
      let nodes = 0
      const arr = observableArray(['a', 'b', 'c'])
      function cb (v) { calls++; nodes += v.nodeOrArrayInserted.length }
      const target = $("<ul data-bind='foreach: { data: arr, afterAdd: cb }'><li data-bind='text: $data'></li></div>")
      applyBindings({arr: arr, cb: cb}, target[0])
      assert.equal(calls, 1)
      assert.equal(nodes, 3)
    })
  })

  describe('beforeRemove', function () {
    it('emits on remove', function () {
      let cbi = 0
      const arr = observableArray(['a1', 'b1', 'c1'])
      function cb (v) {
        arrayForEach(v.nodesToRemove, function (n) { removeNode(n) })
        cbi++
      }
      const target = $("<ul data-bind='foreach: { data: arr, beforeRemove: cb }'><li data-bind='text: $data'></li></div>")
      applyBindings({arr: arr, cb: cb}, target[0])
      assert.equal(cbi, 0)
      assert.equal(target.text(), 'a1b1c1')
      arr.pop()
      assert.equal(target.text(), 'a1b1')
      assert.equal(cbi, 1)
      arr([])
      assert.equal(cbi, 3)
      assert.equal(target.text(), '')
    })

    it('removes an element if a `then`-able is passed', function () {
      let cbi = 0
      const arr = observableArray(['a2', 'b2', 'c2'])
      function cb (/* v */) { cbi++; return {then: function (cb) { cb() }} }
      const target = $("<ul data-bind='foreach: { data: arr, beforeRemove: cb }'><li data-bind='text: $data'></li></div>")
      applyBindings({arr: arr, cb: cb}, target[0])
      assert.equal(cbi, 0)
      assert.equal(target.text(), 'a2b2c2')
      arr.pop()
      assert.equal(target.text(), 'a2b2')
      assert.equal(cbi, 1)
      arr([])
      assert.equal(cbi, 3)
      assert.equal(target.text(), '')
    })
  })

  describe('$index', function () {
    it('is present on the children', function () {
      const target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></ul>")
      const list = ['a', 'b', 'c']
      applyBindings(list, target[0])
      assert.equal(contextFor(target.children()[0]).$index(), 0)
      assert.equal(contextFor(target.children()[1]).$index(), 1)
      assert.equal(contextFor(target.children()[2]).$index(), 2)
    })

    it('is present on children of virtual nodes', function () {
      const target = $('<div><!-- ko foreach: $data -->' +
        "<b data-bind='text: $data'></b>" +
        '<!-- /ko --></div>')
      const list = ['a', 'b', 'c']
      applyBindings(list, target[0])
      assert.equal(contextFor(target.children()[0]).$index(), 0)
      assert.equal(contextFor(target.children()[1]).$index(), 1)
      assert.equal(contextFor(target.children()[2]).$index(), 2)
    })

    it('is present when template starts with a text node', function () {
      const target = document.createElement('ul')
      target.innerHTML = "<ul data-bind='foreach: $data'>" +
          " <li data-bind='text: $index()'></li>" +
        '</ul>'
      const list = ['a', 'b', 'c']
      applyBindings(list, target)
      assert.equal($(target).text(), ' 0 1 2')
    })

    it('is present on a list of text & comment nodes', function () {
      const target = document.createElement('ul')
      target.innerHTML = `<div data-bind='foreach: $data'>
          <!-- ko text: $index --><!-- /ko --><!-- ko text: $data --><!-- /ko -->
        </div>`
      const list = ['a', 'b', 'c']
      applyBindings(list, target)
      assert.equal($(target).text().replace(/\s+/g, ' '), ' 0a 1b 2c ')
    })

    it('updates as part of a calculation', function () {
      const target = document.createElement('ul')
      target.innerHTML = `<div data-bind='foreach: $data'>
          <!-- ko text: $index() * 10 --><!-- /ko --><!-- ko text: $data --><!-- /ko -->
        </div>`
      const list = ['a', 'b', 'c']
      applyBindings(list, target)
      assert.equal($(target).text().replace(/\s+/g, ' '), ' 0a 10b 20c ')
    })

    it('updates in the middle of a list', function () {
      const target = document.createElement('ul')
      target.innerHTML = `<div data-bind='foreach: $data'>
          <!-- ko text: $data === 'b' ? $index() * 10 : '-' --><!-- /ko -->
          <!-- ko text: $data --><!-- /ko -->
        </div>`
      const list = ['a', 'b', 'c']
      applyBindings(list, target)
      assert.equal($(target).text().replace(/\s+/g, ' '), ' - a 10 b - c ')
    })

    it('updates when list is modified', function () {
      const target = document.createElement('ul')
      target.innerHTML = `<div data-bind='foreach: $data'>
          <!-- ko text: $index() * 10 --><!-- /ko --><!-- ko text: $data --><!-- /ko -->
        </div>`
      const list = observableArray(['a', 'b', 'c'])
      applyBindings(list, target)
      list.splice(0, 0, 'z')
      assert.equal($(target).text().replace(/\s+/g, ' '), ' 0z 10a 20b 30c ')
      list.splice(2, 1)
      assert.equal($(target).text().replace(/\s+/g, ' '), ' 0z 10a 20c ')
    })

    it('updates the first list item', function () {
      const target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></ul>")
      const list: ObservableArray<string> = observableArray([])
      applyBindings(list, target[0])
      list.push('a')
      assert.equal(contextFor(target.children()[0]).$index(), 0)
    })

    it('updates on append', function () {
      const target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></ul>")
      const list = observableArray(['a', 'b', 'c'])
      applyBindings(list, target[0])
      list.push('d')
      assert.equal(contextFor(target.children()[0]).$index(), 0)
      assert.equal(contextFor(target.children()[1]).$index(), 1)
      assert.equal(contextFor(target.children()[2]).$index(), 2)
      assert.equal(contextFor(target.children()[3]).$index(), 3)
    })

    it('updates on prepend', function () {
      const target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></ul>")
      const list = observableArray(['a', 'b', 'c'])
      applyBindings(list, target[0])
      list.unshift('e')
      assert.equal(contextFor(target.children()[0]).$index(), 0)
      assert.equal(contextFor(target.children()[1]).$index(), 1)
      assert.equal(contextFor(target.children()[2]).$index(), 2)
      assert.equal(contextFor(target.children()[3]).$index(), 3)
    })

    it('updates on splice', function () {
      const target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></ul>")
      const list = observableArray(['a', 'b', 'c'])
      applyBindings(list, target[0])
      // Delete 2 at 1, insert 2
      list.splice(1, 2, 'r', 'q')
      assert.equal(contextFor(target.children()[0]).$index(), 0)
      assert.equal(contextFor(target.children()[1]).$index(), 1)
      assert.equal(contextFor(target.children()[2]).$index(), 2)
    })

    it('is not initially an observable', function () {
      const target = $("<ul data-bind='foreach: {data: $data, noIndex: true}'><li data-bind='text: $data'></li></ul>")
      const list = observableArray(['a'])
      applyBindings(list, target[0])
      assert.notOk(isObservable(contextFor(target.children()[0]).$index))
    })

    it('is observable after the first call', function () {
      const target = $("<ul data-bind='foreach: {data: $data, noIndex: true}'><li data-bind='text: $data'></li></ul>")
      const list = observableArray(['a'])
      applyBindings(list, target[0])
      const $index = contextFor(target.children()[0]).$index
      assert.equal($index(), 0)
      assert.ok(isObservable(contextFor(target.children()[0]).$index))
    })

    it('is present with `as`', function () {
      const target = $("<ul data-bind='foreach: {data: $data, as: \"$item\"}'><li data-bind='text: $item'></li></ul>")
      const list = observableArray(['a', 'b'])
      applyBindings(list, target[0])
      assert.equal(contextFor(target.children()[0]).$index(), 0)
      assert.equal(contextFor(target.children()[1]).$index(), 1)
    })
  })

  describe('`as` parameter', function () {
    it('is used when present', function () {
      const target = $("<ul data-bind='foreach: { data: $data, as: \"xyz\" }'><li data-bind='text: xyz'></li></ul>")
      const list = ['a', 'b', 'c']
      applyBindings(list, target[0])
      assert.equal(target.text(), 'abc')
    })

    it('each item has the same $data as its parent', function () {
      const target = $("<ul data-bind='foreach: { data: $data, as: \"xyz\" }'><li data-bind='text: xyz'></li></ul>")
      const list = ['a', 'b', 'c']
      applyBindings(list, target[0])
      assert.strictEqual(dataFor(target.children()[0]).$data, dataFor(target as any))
      assert.strictEqual(dataFor(target.children()[1]).$data, dataFor(target as any))
      assert.strictEqual(dataFor(target.children()[2]).$data, dataFor(target as any))
    })

    it('has an $index', function () {
      const target = $("<ul data-bind='foreach: { data: $data, as: \"xyz\" }'><li data-bind='text: xyz'></li></ul>")
      const list = ['a', 'b', 'c']
      applyBindings(list, target[0])
      assert.equal(contextFor(target.children()[0]).$index(), 0)
      assert.equal(contextFor(target.children()[1]).$index(), 1)
      assert.equal(contextFor(target.children()[2]).$index(), 2)
    })

    it('reads `as` from peer binding parameters', function () {
      const target = $("<ul data-bind='foreach: $data, as: \"xyz\"'><li data-bind='text: xyz'></li></ul>")
      const list = ['a', 'b', 'c']
      applyBindings(list, target[0])
      assert.equal(target.text(), 'abc')
    })
  })
})

describe('focus', function () {
  let $target
  beforeEach(function () {
    $target = $("<div data-bind='foreach: $data'>" +
      '<input />' +
      '</div>')
      .appendTo(document.body)
    ForEachBinding.setSync(false)
  })

  afterEach(function () {
    $target.remove()
  })

  it('does not preserve the target on apply bindings', function (done) {
    const list = ['a', 'b', 'c']
    $target.find(':input').focus()
    applyBindings(list, $target[0])
    setTimeout(function () {
      assert.strictEqual(document.activeElement, document.body)
      done()
    }, 1000)
  })

  it('does not preserves primitive targets when re-ordering', function (done) {
    const list = observableArray(['a', 'b', 'c'])
    applyBindings(list, $target[0])
    $target.find(':input').first().focus()
    assert.strictEqual(document.activeElement, $target.find(':input')[0])

    list.remove('a')
    list.push('a')
    setTimeout(function () {
      assert.strictEqual(document.activeElement, document.body)
      done()
    }, 1000)
  })

  it('preserves objects when re-ordering', function (done) {
    const o0 = {}
    const list = observableArray([o0, 'b', 'c'])
    applyBindings(list, $target[0])
    $target.find(':input').first().focus()
    assert.strictEqual(document.activeElement, $target.find(':input')[0], 'a')

    list.remove(o0)
    list.push(o0)
    setTimeout(function () {
      assert.strictEqual(document.activeElement, $target.find(':input')[2], 'o')
      done()
    }, 1000)
  })

  it('preserves objects when re-ordering multiple identical', function (done) {
    const o0 = {}
    const list = observableArray([o0, 'b', 'c'])
    applyBindings(list, $target[0])
    $target.find(':input').first().focus()
    assert.strictEqual(document.activeElement, $target.find(':input')[0], 'a')

    list.remove(o0)
    list.push('x')
    list.push(o0)
    list.push('y')

    setTimeout(function () {
      assert.strictEqual(document.activeElement, $target.find(':input')[3], 'o')
      done()
    }, 1000)
  })

  it('preserves objects when re-ordering multiple identical, alt', function (done) {
    const o0 = {}
    const list = observableArray([o0, 'b', 'c'])
    applyBindings(list, $target[0])
    $target.find(':input').first().focus()
    assert.strictEqual(document.activeElement, $target.find(':input')[0], 'a')

    list.remove(o0)
    list.push(o0) // focused
    list.push(o0)

    setTimeout(function () {
      assert.strictEqual(document.activeElement, $target.find(':input')[2], 'o')
      done()
    }, 1000)
  })
})

describe('$list', function () {
  it('exposes a list', function () {
    const target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>")
    const list = ['a', 'b', 'c']
    applyBindings(list, target[0])
    assert.strictEqual(
      contextFor(target.children()[1]).$list, list
    )
  })

  it('exposes an observable array', function () {
    const target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>")
    const list = observableArray(['a', 'b', 'c'])
    applyBindings(list, target[0])
    assert.strictEqual(
      contextFor(target.children()[1]).$list, list
    )
  })

  it('exposes an observable array with `as`', function () {
    const target = $("<ul data-bind='foreach: $data, as: \"x\"'><li data-bind='text: x'></li></div>")
    const list = observableArray(['a', 'b', 'c'])
    applyBindings(list, target[0])
    assert.strictEqual(
      contextFor(target.children()[1]).$list, list
    )
  })

  it('exposes an observable array with `as` + noIndex', function () {
    const target = $("<ul data-bind='foreach: $data, as: \"x\", noIndex: true'><li data-bind='text: x'></li></div>")
    const list = observableArray(['a', 'b', 'c'])
    applyBindings(list, target[0])
    assert.strictEqual(
      contextFor(target.children()[1]).$list, list
    )
  })

  it('exposes an observable array with noIndex', function () {
    const target = $("<ul data-bind='foreach: $data, noIndex: true'><li data-bind='text: $data'></li></div>")
    const list = observableArray(['a', 'b', 'c'])
    applyBindings(list, target[0])
    assert.strictEqual(
      contextFor(target.children()[1]).$list, list
    )
  })
})
