
import {
  unwrap
} from '@tko/observable'

import {
  Provider
} from '@tko/provider'

import {
  parseInterpolation
} from './mustacheParser'
import { ProviderParamsInput } from 'packages/provider/src/Provider'

/**
 * These are bindings that are mapped specific attributes, such as
 * two-way communication (value/checked) or which have anti-collision
 * properties (css).
 */
const DEFAULT_ATTRIBUTE_BINDING_MAP = {
  value: 'value',
  checked: 'checked',
  class: 'css'
}

/**
 *  Interpret {{ }} inside DOM attributes e.g. <div class='{{ classes }}'>
 */
export default class AttributeMustacheProvider extends Provider {
  ATTRIBUTES_TO_SKIP: Set<string>
  ATTRIBUTES_BINDING_MAP: any
  get FOR_NODE_TYPES () { return [ 1 ] } // document.ELEMENT_NODE

  constructor (params:ProviderParamsInput|null = null) {
    super(params)
    this.ATTRIBUTES_TO_SKIP = new Set(params?.attributesToSkip || ['data-bind'])
    this.ATTRIBUTES_BINDING_MAP = params?.attributesBindingMap || DEFAULT_ATTRIBUTE_BINDING_MAP
  }

  * attributesToInterpolate (attributes: NamedNodeMap) {
    for (const attr of Array.from(attributes)) {
      if (this.ATTRIBUTES_TO_SKIP.has(attr.name)) { continue }
      if (attr.specified && attr.value.includes('{{')) { yield attr }
    }
  }

  nodeHasBindings (node: HTMLElement) {
    return !this.attributesToInterpolate(node.attributes).next().done
  }

  partsTogether (parts: any[], context: any, node: HTMLElement, ...valueToWrite: any[]) {
    if (parts.length > 1) {
      return parts
        .map((p: { asAttr: (arg0: any, arg1: any, arg2: HTMLElement) => any }) => unwrap(p.asAttr(context, this.globals, node))).join('')
    }
    // It may be a writeable observable e.g. value="{{ value }}".
    const part = parts[0].asAttr(context, this.globals)
    if (valueToWrite.length) { part(valueToWrite[0]) }
    return part
  }

  attributeBinding (name: string, parts: any[]): (string | any[])[] {
    return [name, parts]
  }

  * bindingParts (node: HTMLElement, context: any) {
    for (const attr of this.attributesToInterpolate(node.attributes)) {
      const parts = Array.from(parseInterpolation(attr.value))
      if (parts.length) { yield this.attributeBinding(attr.name, parts) }
    }
  }

  getPossibleDirectBinding (attrName: string | number) {
    const bindingName = this.ATTRIBUTES_BINDING_MAP[attrName]
    return bindingName && this.bindingHandlers.get(attrName)
  }

  * bindingObjects (node: HTMLElement, context: any) {
    for (const [attrName, parts] of this.bindingParts(node, context)) {
      const bindingForAttribute = this.getPossibleDirectBinding(attrName)
      const handler = bindingForAttribute ? attrName : `attr.${attrName}`
      const accessorFn = bindingForAttribute
        ? (...v: any) => this.partsTogether(parts, context, node, ...v)
        : (...v: any) => ({[attrName]: this.partsTogether(parts, context, node, ...v)})
      node.removeAttribute(attrName)
      yield { [handler]: accessorFn }
    }
  }

  getBindingAccessors (node: HTMLElement, context?: {}) {
    return Object.assign({}, ...this.bindingObjects(node, context))
  }
}
