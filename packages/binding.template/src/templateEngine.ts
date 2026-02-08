// If you want to make a custom template engine,
//
// [1] Inherit from this class (like ko.nativeTemplateEngine does)
// [2] Override 'renderTemplateSource', supplying a function with this signature:
//
//        function (templateSource, bindingContext, options) {
//            // - templateSource.text() is the text of the template you should render
//            // - bindingContext.$data is the data you should pass into the template
//            //   - you might also want to make bindingContext.$parent, bindingContext.$parents,
//            //     and bindingContext.$root available in the template too
//            // - options gives you access to any other properties set on "data-bind: { template: options }"
//            // - templateDocument is the document object of the template
//            //
//            // Return value: an array of DOM nodes
//        }
//
// [3] Override 'createJavaScriptEvaluatorBlock', supplying a function with this signature:
//
//        function (script) {
//            // Return value: Whatever syntax means "Evaluate the JavaScript statement 'script' and output the result"
//            //               For example, the jquery.tmpl template engine converts 'someScript' to '${ someScript }'
//        }
//
//     This is only necessary if you want to allow data-bind attributes to reference arbitrary template variables.
//     If you don't want to allow that, you can set the property 'allowTemplateRewriting' to false (like ko.nativeTemplateEngine does)
//     and then you don't need to override 'createJavaScriptEvaluatorBlock'.

import { options } from '@tko/utils'
import { DomElement, AnonymousTemplate } from './templateSources'
import type { TemplateSource } from './templateSources'
import type { BindingContext } from '@tko/bind'

export interface TemplateOptions<T = any> {
  afterRender?: (elements: Node[], dataItem: T) => void
  templateEngine?: TemplateEngine
}

export interface TemplateEngine {
  allowTemplateRewriting: boolean

  renderTemplateSource(
    templateSource: TemplateSource,
    bindingContext: BindingContext<any>,
    options: TemplateOptions<any>,
    templateDocument?: Document
  ): Node[]
  createJavaScriptEvaluatorBlock(script: string): string

  makeTemplateSource(template: string | Node, templateDocument?: Document): TemplateSource | undefined

  renderTemplate(
    template: string | Node,
    bindingContext: BindingContext<any>,
    options: TemplateOptions<any>,
    templateDocument?: Document
  ): Node[]

  //  isTemplateRewritten(template: string | Node, templateDocument?: Document): boolean;

  //  rewriteTemplate(template: string | Node, rewriterCallback: (val: string) => string, templateDocument?: Document): void;
}

export abstract class TemplateEngineBase implements TemplateEngine {
  allowTemplateRewriting: boolean
  // abstract isTemplateRewritten(template: string | Node, templateDocument?: Document): boolean;
  // abstract rewriteTemplate(template: string | Node, rewriterCallback: (val: string) => string, templateDocument?: Document): void;
  abstract renderTemplateSource(
    templateSource: TemplateSource,
    bindingContext: BindingContext<any>,
    options,
    templateDocument?: Document
  ): Node[]
  createJavaScriptEvaluatorBlock(script: string): string {
    if (!this.allowTemplateRewriting) return ''
    options.onError('Override createJavaScriptEvaluatorBlock')
    throw 'Override createJavaScriptEvaluatorBlock'
  }

  makeTemplateSource(template: string | Node, templateDocument?: Document): TemplateSource | undefined {
    // Named template
    if (typeof template === 'string') {
      templateDocument = templateDocument || document
      var elem = templateDocument.getElementById(template)
      if (!elem) {
        options.onError(new Error('Cannot find template with ID ' + template))
      }
      return new DomElement(elem)
    } else if (template.nodeType == 1 || template.nodeType == 8) {
      // Anonymous template
      return new AnonymousTemplate(template)
    } else {
      options.onError(new Error('Unknown template type: ' + template))
    }
  }

  renderTemplate(
    template: string | Node,
    bindingContext: BindingContext<any>,
    options: TemplateOptions<any>,
    templateDocument?: Document
  ): Node[] {
    var templateSource = this.makeTemplateSource(template, templateDocument)
    if (templateSource == null) {
      return []
    }
    return this.renderTemplateSource(templateSource, bindingContext, options, templateDocument)
  }
}
