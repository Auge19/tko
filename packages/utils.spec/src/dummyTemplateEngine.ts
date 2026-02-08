import { extend, arrayPushAll, parseHtmlFragment } from '@tko/utils'

import {
  renderTemplate,
  AnonymousTemplate,
  TemplateEngine,
  TemplateEngineBase,
  TemplateSource
} from '@tko/binding.template'

import type { BindingContext } from '@tko/bind'

class DummyTemplateSource implements TemplateSource {
  private inMemoryTemplates
  private inMemoryTemplateData

  constructor(private id: string) {}

  text(): string
  text(valueToWrite: string): void
  text(valueToWrite?: unknown): string | void {
    if (arguments.length >= 1) this.inMemoryTemplates[this.id] = valueToWrite
    return this.inMemoryTemplates[this.id]
  }
  data(key: string)
  data<T>(key: string): T
  data<T>(key: string, valueToWrite: T): void
  data<T>(key: string, valueToWrite?: T): any {
    if (arguments.length >= 2) {
      this.inMemoryTemplateData[this.id] = this.inMemoryTemplateData[this.id] || {}
      this.inMemoryTemplateData[this.id][key] = valueToWrite
    }
    return (this.inMemoryTemplateData[this.id] || {})[key]
  }
  nodes: { (): Node; (valueToWrite: Node): void }
}

export class DummyTemplateEngine extends TemplateEngineBase {
  constructor(templates?: any) {
    super()
  }

  override makeTemplateSource(template: string | Node, templateDocument?: Document): TemplateSource | undefined {
    if (typeof template == 'string')
      return new DummyTemplateSource(template) // Named template comes from the in-memory collection
    else if (template.nodeType == 1 || template.nodeType == 8) return new AnonymousTemplate(template) // Anonymous template
  }

  override renderTemplateSource(
    templateSource: TemplateSource,
    bindingContext: BindingContext,
    rt_options,
    templateDocument
  ) {
    let data = bindingContext['$data']
    if (data && typeof data.get_value === 'function') {
      // For cases when data is an Identifier/Expression.
      data = data.get_value(data, bindingContext)
    }
    templateDocument = templateDocument || document
    rt_options = rt_options || {}
    let templateText: any = templateSource.text()
    if (typeof templateText == 'function') templateText = templateText(data, rt_options)

    templateText = rt_options.showParams ? templateText + ', data=' + data + ', options=' + rt_options : templateText
    // var templateOptions = options.templateOptions; // Have templateOptions in scope to support [js:templateOptions.foo] syntax

    let result

    data = data || {}
    // Builders (e.g. rollup) mangle `data` to e.g. `data$$1`.
    // This workaround works as long as nomangle$data doesn't
    // appear anywhere not in tests.
    const nomangle$data: any = data
    ;(window as any).__prevent_tree_shaking__ = nomangle$data
    delete (window as any).__prevent_tree_shaking__

    rt_options.templateRenderingVariablesInScope = rt_options.templateRenderingVariablesInScope || {}

    extend(data, rt_options.templateRenderingVariablesInScope)

    // Dummy [renderTemplate:...] syntax
    result = templateText.replace(/\[renderTemplate\:(.*?)\]/g, function (match, templateName) {
      return renderTemplate(templateName, data, rt_options)
    })

    let evalHandler = function (match, script) {
      try {
        let evalResult = eval(script)
        return evalResult === null || evalResult === undefined ? '' : evalResult.toString()
      } catch (ex: any) {
        throw new Error('Error evaluating script: [js: ' + script + ']\n\nException: ' + ex.toString())
      }
    }

    // Dummy [[js:...]] syntax (in case you need to use square brackets inside the expression)
    result = result.replace(/\[\[js\:([\s\S]*?)\]\]/g, evalHandler)

    // Dummy [js:...] syntax
    result = result.replace(/\[js\:([\s\S]*?)\]/g, evalHandler)
    /*with (bindingContext) {
            with (data || {}) {
                with (options.templateRenderingVariablesInScope || {}) {

                }
            }
        }*/

    // Use same HTML parsing code as real template engine so as to trigger same combination of IE weirdnesses
    // Also ensure resulting nodelist is an array to mimic what the default templating engine does, so we see the effects of not being able to remove dead memo comment nodes.
    return arrayPushAll([], parseHtmlFragment(result, templateDocument))
  }

  rewriteTemplate(template, rewriterCallback, templateDocument) {
    // Only rewrite if the template isn't a function (can't rewrite those)
    let templateSource = this.makeTemplateSource(template, templateDocument)

    // TODO
    // if (typeof templateSource?.text() != "function")
    //     return super.rewriteTemplate(template, rewriterCallback, templateDocument);
  }
  createJavaScriptEvaluatorBlock(script) {
    return '[js:' + script + ']'
  }
}
