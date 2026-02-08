import { ieVersion, makeArray, parseHtmlFragment } from '@tko/utils'
import { TemplateEngineBase, TemplateOptions } from './templateEngine'
import { setTemplateEngine } from './templating'
import type { TemplateSource } from './templateSources'
import type { BindingContext } from '@tko/bind'

export class NativeTemplateEngine extends TemplateEngineBase {
  private static _instance: NativeTemplateEngine
  static get instance(): NativeTemplateEngine {
    if (this._instance == null) {
      this._instance = new NativeTemplateEngine()
    }

    return this._instance
  }

  allowTemplateRewriting = false

  renderTemplateSource(
    templateSource: TemplateSource,
    bindingContext: BindingContext<any>,
    options: TemplateOptions<any>,
    templateDocument?: Document
  ): Node[] {
    const version = ieVersion ?? 0
    var useNodesIfAvailable = !(version < 9), // IE<9 cloneNode doesn't work properly
      templateNodesFunc = useNodesIfAvailable ? templateSource.nodes : null,
      templateNodes = templateNodesFunc ? templateSource.nodes?.() : null

    if (templateNodes) {
      return makeArray(templateNodes.cloneNode(true).childNodes)
    } else {
      var templateText = templateSource.text()
      return parseHtmlFragment(templateText, templateDocument)
    }
  }
}
setTemplateEngine(NativeTemplateEngine.instance)
