/// <reference types="jasmine" />
/// <reference types="jquery" />


/*
 * Configure the Jasmine testing framework.
 */
 /* globals runs, waitsFor, jasmine */
 
import {
  arrayMap, arrayFilter, ieVersion, selectExtensions, hasOwnProperty
} from '../dist/'

window.DEBUG = true;
window.amdRequire = window.require;

jasmine.updateInterval = 500;

/*
    Some helper functions for jasmine on the browser
 */
jasmine.resolve = function (promise : Promise<boolean>) {
  let complete = false
  jasmine.runs(() => promise.then((result) => { complete = result || true }))
  jasmine.waitsFor(() => complete)
}

jasmine.prepareTestNode = function() : HTMLElement {
    // The bindings specs make frequent use of this utility function to set up
    // a clean new DOM node they can execute code against
    const existingNode = document.getElementById("testNode");
    if (existingNode !== null && existingNode.parentNode)
        existingNode.parentNode.removeChild(existingNode);
    const testNode = document.createElement("div");
    testNode.id = "testNode";
    document.body.appendChild(testNode);

    return testNode;
};

export function useMockForTasks(options) {
    return jasmine.clock().install();
}

/*
jasmine.clock().mockScheduler = function (callback) {
    setTimeout(callback, 0);
};




jasmine.Spec.prototype.restoreAfter = function(object, propertyName) {
    var originalValue = object[propertyName];
    this.after(function() {
        object[propertyName] = originalValue;
    });
}; */

jasmine.nodeText = function(node) {
    return node.nodeType == 3 ? node.data : 'textContent' in node ? node.textContent : node.innerText;
};

jasmine.browserSupportsProtoAssignment = { __proto__: [] } instanceof Array;


jasmine.ieVersion = ieVersion;

jasmine.setNodeText = function(node, text:string) {
    'textContent' in node ? node.textContent = text : node.innerText = text;
};


jasmine.runs = function(func : Function) {
    return func();
}

jasmine.sleep = function(timeMillis : number) {
    return new Promise<void>(resolve => setTimeout(() => resolve(), timeMillis));
}

jasmine.wait = async function (timeMillis : number) {
    await jasmine.sleep(timeMillis);
}

jasmine.waitsFor = async function(conditionFunc : () => boolean,timeoutMsg?: string, timeoutMillis?: number) {
    timeoutMillis = timeoutMillis || 5000;
    const start = new Date().getTime();

    await waitInternal(conditionFunc, start, timeoutMillis, timeoutMsg);
}

function waitInternal(conditionFunc: () => boolean, start: number, timeoutMillis: number | undefined, timeoutMsg: string | undefined): any {
    return new Promise<void>((resolve, reject) => {
        function checkCondition() {
            if (conditionFunc()) {
                resolve();
            } else if (new Date().getTime() - start >= timeoutMillis!) {
                reject(new Error(timeoutMsg || 'Timeout waiting for condition'));
            } else {
                setTimeout(checkCondition, 1000);
            }
        }
        checkCondition();
    });
}

function cleanedHtml(node) {
    var cleanedHtml = node.innerHTML.toLowerCase().replace(/\r\n/g, "");
    // IE < 9 strips whitespace immediately following comment nodes. Normalize by doing the same on all browsers.
    cleanedHtml = cleanedHtml.replace(/(<!--.*?-->)\s*/g, "$1");
    // Also remove __ko__ expando properties (for DOM data) - most browsers hide these anyway but IE < 9 includes them in innerHTML
    cleanedHtml = cleanedHtml.replace(/ __ko__\d+=\"(ko\d+|null)\"/g, "");
    return cleanedHtml;
}

/*
    Custom Matchers
    ~~~~~~~~~~~~~~~
 */
var matchers : jasmine.CustomMatcherFactories  = {

    toBeInstanceExactlyOf: function (util: jasmine.MatchersUtil): jasmine.CustomMatcher {
        return {
            compare: function (actual: any, expected: jasmine.Constructor): jasmine.CustomMatcherResult {
                if (actual instanceof expected &&
                actual.constructor.name === expected.name &&
                actual.constructor.valueOf() === expected.valueOf()) {
                return {
                    pass: true,
                    message: `Instance is exactly of type`
                };
                } else {
                return {
                    pass: false,
                    message: `Instance (${actual.constructor.valueOf()}) is not exactly of type (${expected.valueOf()})`
                };
                }
            }
        };
    },

    toHaveNodeTypes: function (util: jasmine.MatchersUtil): jasmine.CustomMatcher {
        return {
            compare: function (actual: any, expectedTypes: any): jasmine.CustomMatcherResult {
                const values = arrayMap(actual, function (node) {
                    return node.nodeType;
                });
                const pass = util.equals(values, expectedTypes);
                return {
                    pass: pass,
                    message: `Expected node types to be ${JSON.stringify(expectedTypes)}, but got ${JSON.stringify(values)}`
                };
            }
        };
    },

    toContainHtmlElementsAndText: function (util: jasmine.MatchersUtil): jasmine.CustomMatcher {
        return {
            compare: function (actual: any, expectedHtml: string): jasmine.CustomMatcherResult {
                const cleanedActual = cleanedHtml(actual).replace(/<!--.+?-->/g, "");
                const pass = cleanedActual === expectedHtml;
                return {
                    pass: pass,
                    message: `Expected HTML to be ${expectedHtml}, but got ${cleanedActual}`
                };
            }
        };
    },

    toContainText: function (util: jasmine.MatchersUtil): jasmine.CustomMatcher {
        return {
            compare: function (actual: any, expectedText: string, ignoreSpaces?: boolean): jasmine.CustomMatcherResult {
                let cleanExpectedText = expectedText;
                if (ignoreSpaces) {
                    cleanExpectedText = cleanExpectedText.replace(/\s/g, "");
                }

                let cleanedActualText = jasmine.nodeText(actual).replace(/\r\n/g, "\n");
                if (ignoreSpaces) {
                    cleanedActualText = cleanedActualText.replace(/\s/g, "");
                }

                const pass = cleanedActualText === cleanExpectedText;
                return {
                    pass: pass,
                    message: `Expected text to be "${cleanExpectedText}", but got "${cleanedActualText}"`
                };
            }
        };
    },

    toHaveOwnProperties: function (util: jasmine.MatchersUtil): jasmine.CustomMatcher {
        return {
            compare: function (actual: any, expectedProperties: any): jasmine.CustomMatcherResult {
                const ownProperties: string[] = [];
                for (const prop in actual) {
                    if (hasOwnProperty(actual, prop)) {
                        ownProperties.push(prop);
                    }
                }
                const pass = util.equals(ownProperties, expectedProperties);
                return {
                    pass: pass,
                    message: pass ? 'ok' : 'Expected to equal one but got more'
                };
            }
        };
    },

    toHaveTexts: function (util: jasmine.MatchersUtil): jasmine.CustomMatcher {
        return {
            compare: function (actual: any, expectedTexts: any): jasmine.CustomMatcherResult {
                const texts = arrayMap(actual.childNodes, jasmine.nodeText);
                const pass = util.equals(texts, expectedTexts);
                return {
                    pass: pass,
                    message: pass ? 'ok' : 'Expected to equal one but got more'
                };
            }
        };
    },

    toHaveValues: function (util: jasmine.MatchersUtil): jasmine.CustomMatcher {
        return {
            compare: function (actual: any, expectedValues: any): jasmine.CustomMatcherResult {
                const values = arrayFilter(arrayMap(actual.childNodes, (node: any) => node.value), (value: any) => value !== undefined);
                const pass = util.equals(values, expectedValues);
                return {
                    pass: pass,
                    message: pass ? 'ok' : 'Expected to equal one but got more'
                };
            }
        };
    },

    toHaveCheckedStates: function (util: jasmine.MatchersUtil): jasmine.CustomMatcher {
        return {
            compare: function (actual: any, expectedValues: any): jasmine.CustomMatcherResult {
                const values = arrayMap(actual.childNodes, (node: any) => node.checked);
                const pass = util.equals(values, expectedValues);
                return {
                    pass: pass,
                    message: pass ? 'ok' : 'Expected to equal one but got more'
                };
            }
        };
    },

    toThrowContaining: function (util: jasmine.MatchersUtil): jasmine.CustomMatcher {
        return {
            compare: function (actual: any, expected: string): jasmine.CustomMatcherResult {
                let exception: any;
                try {
                    actual();
                } catch (e) {
                    exception = e;
                }
                const exceptionMessage = exception && (exception.message || exception);
                const pass = exception ? (exceptionMessage as string).includes(expected) : false;
                return {
                    pass: pass,
                    message: pass ? `Expected not to throw containing '${expected}'` : `Expected to throw containing '${expected}', but got '${exceptionMessage}'`
                };
            }
        };
    },

    toEqualOneOf: function (util: jasmine.MatchersUtil): jasmine.CustomMatcher {
        return {
            compare: function (actual: any, expectedPossibilities: any[]): jasmine.CustomMatcherResult {
                const pass = expectedPossibilities.some(possibility => util.equals(actual, possibility));
                return {
                    pass: pass,
                    message: pass ? 'ok' : 'Expected to equal one but got more'
                };
            }
        };
    },

    toContainHtml: function (util: jasmine.MatchersUtil): jasmine.CustomMatcher {
        return {
            compare: function (actual: any, expectedHtml: string, postProcessCleanedHtml?: (html: string) => string): jasmine.CustomMatcherResult {
                let cleanedHtml = actual.innerHTML.toLowerCase().replace(/\r\n/g, "");
                cleanedHtml = cleanedHtml.replace(/(<!--.*?-->)\s*/g, "$1");
                cleanedHtml = cleanedHtml.replace(/ __ko__\d+=\"(ko\d+|null)\"/g, "");
                let processedExpectedHtml = expectedHtml.replace(/(<!--.*?-->)\s*/g, "$1");
                if (postProcessCleanedHtml) {
                    cleanedHtml = postProcessCleanedHtml(cleanedHtml);
                }
                const pass = cleanedHtml === processedExpectedHtml;
                return {
                    pass: pass,
                    message: pass ? 'ok' : `Expected HTML to be ${processedExpectedHtml}, but got ${cleanedHtml}`
                };
            }
        };
    }
}


beforeEach(function() {
    jasmine.addMatchers(matchers);
});
