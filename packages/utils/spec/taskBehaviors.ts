import { useMockForTasks } from '../helpers/jasmine-13-helper'

import { tasks, options, ieVersion } from '../dist'

describe('Tasks', function () {
  beforeEach(function () {
    useMockForTasks(options)
  })

  afterEach(function () {
        // Check that task schedule is clear after each test
    expect(tasks.resetForTesting()).toEqual(0)
    jasmine.Clock.reset()
  })

  it('Should run in next execution cycle', function () {
    var runCount = 0
    tasks.schedule(function () {
      runCount++
    })
    expect(runCount).toEqual(0)

    jasmine.Clock.tick(1)
    expect(runCount).toEqual(1)
  })

  it('Should run multiple times if added more than once', function () {
    var runCount = 0
    var func = function () {
      runCount++
    }
    tasks.schedule(func)
    tasks.schedule(func)
    expect(runCount).toEqual(0)

    jasmine.Clock.tick(1)
    expect(runCount).toEqual(2)
  })

  it('Should run scheduled tasks in the order they were scheduled', function () {
    var runValues : any = []
    var func = function (value) {
      runValues.push(value)
    }

    tasks.schedule(func.bind(null, 1))
    tasks.schedule(func.bind(null, 2))

    jasmine.Clock.tick(1)
    expect(runValues).toEqual([1, 2])
  })

  it('Should run tasks again if scheduled after a previous run', function () {
    var runCount = 0
    var func = function () {
      runCount++
    }
    tasks.schedule(func)
    expect(runCount).toEqual(0)

    jasmine.Clock.tick(1)
    expect(runCount).toEqual(1)

    tasks.schedule(func)
    expect(runCount).toEqual(1)

    jasmine.Clock.tick(1)
    expect(runCount).toEqual(2)
  })

  it('Should process newly scheduled tasks during task processing', function () {
    var runValues = new Array
    var func = function (value) {
      runValues.push(value)
      tasks.schedule(function () {
        runValues.push('x')
      })
    }

    tasks.schedule(func.bind(null, 'i'))
    expect(runValues).toEqual([])

    jasmine.Clock.tick(1)
    expect(runValues).toEqual(['i', 'x'])
  })

  it('Should keep correct state if a task throws an exception', function () {
    var runValues = new Array
    var func = function (value) {
      runValues.push(value)
    }
    tasks.schedule(func.bind(null, 1))
    tasks.schedule(function () {
      throw Error('test')
    })
    tasks.schedule(func.bind(null, 2))
    expect(runValues).toEqual([])

        // When running tasks, it will throw an exception after completing all tasks
    expect(function () {
      jasmine.Clock.tick(1)
    }).toThrow()
    expect(runValues).toEqual([1, 2])
  })

  it('Should stop recursive task processing after a fixed number of iterations', function () {
    var runValues = new Array
    var func = function () {
      runValues.push('x')
      tasks.schedule(function () {})
      tasks.schedule(func)
    }

    tasks.schedule(func)
    expect(runValues).toEqual([])

    expect(function () {
      jasmine.Clock.tick(1)
    }).toThrowContaining('Too much recursion')

        // 5000 is the current limit in the code, but it could change if needed.
    expect(runValues.length).toEqual(5000)
  })

  it('Should not stop non-recursive task processing', function () {
    var runValues = new Array
    var func = function () {
      runValues.push('x')
    }

    for (var i = 0; i < 10000; ++i) {
      tasks.schedule(func)
    }
    expect(runValues).toEqual([])

    jasmine.Clock.tick(1)
    expect(runValues.length).toEqual(10000)
  })

  describe('Cancel', function () {
    it('Should prevent task from running', function () {
      var runCount = 0
      var handle = tasks.schedule(function () {
        runCount++
      })
      tasks.cancel(handle)

      jasmine.Clock.tick(1)
      expect(runCount).toEqual(0)
    })

    it('Should prevent only the canceled task', function () {
      var runCount = 0
      var func = function () {
        runCount++
      }
      var handle1 = tasks.schedule(func)
      var handle2 = tasks.schedule(func)
      tasks.cancel(handle2)

      jasmine.Clock.tick(1)
      expect(runCount).toEqual(1)
    })

    it('Should do nothing if task has already run', function () {
      var runValues = new Array
      var func = function (value) {
        runValues.push(value)
      }
      var handle1 = tasks.schedule(func.bind(null, 1))
      expect(runValues).toEqual([])

      jasmine.Clock.tick(1)
      expect(runValues).toEqual([1])

      var handle2 = tasks.schedule(func.bind(null, 2))

            // Try to cancel the first task
      tasks.cancel(handle1)

            // But nothing should happen; the second task will run in the next iteration
      jasmine.Clock.tick(1)
      expect(runValues).toEqual([1, 2])
    })

    it('Should work correctly after a task throws an exception', function () {
      var runValues = new Array, handle
      var func = function (value) {
        runValues.push(value)
      }

      tasks.schedule(func.bind(null, 1))
      tasks.schedule(function () {
        throw Error('test')
      })
      tasks.schedule(function () {
        tasks.cancel(handle)
      })
      handle = tasks.schedule(func.bind(null, 2))
      tasks.schedule(func.bind(null, 3))
      expect(runValues).toEqual([])

            // When running tasks, it will throw an exception after completing the tasks
      expect(function () {
        jasmine.Clock.tick(1)
      }).toThrow()
      expect(runValues).toEqual([1, 3])  // The canceled task will be skipped
    })
  })

  describe('runEarly', function () {
    it('Should run tasks early', function () {
      var runValues = new Array
      var func = function (value) {
        runValues.push(value)
      }
      tasks.schedule(func.bind(null, 1))
      expect(runValues).toEqual([])

            // Immediately runs any scheduled tasks
      tasks.runEarly()
      expect(runValues).toEqual([1])

            // Skip calling jasmine.Clock.tick to show that the queue is clear
    })

    it('Should run tasks early during task processing', function () {
      var runValues = new Array
      var func = function (value) {
        runValues.push(value)
      }

            // Schedule two tasks; the first one schedules other tasks and calls runEarly
      tasks.schedule(function () {
        tasks.schedule(func.bind(null, 2))
        expect(runValues).toEqual([])

        tasks.runEarly()
        expect(runValues).toEqual([1, 2])

                // Schedule another task; it will be run after this one completes
        tasks.schedule(func.bind(null, 3))
      })
      tasks.schedule(func.bind(null, 1))

      jasmine.Clock.tick(1)
      expect(runValues).toEqual([1, 2, 3])
    })

    it('Should stop recursive task processing after a fixed number of iterations', function () {
      var runValues = new Array
      var func = function () {
        runValues.push('x')
        tasks.schedule(function () {})
        tasks.schedule(func)
      }

      tasks.schedule(func)
      expect(runValues).toEqual([])

      tasks.runEarly()    // No exception thrown yet, but the recursion was ended
            // 5000 is the current limit in the code, but it could change if needed.
      expect(runValues.length).toEqual(5000)

      expect(function () {
        jasmine.Clock.tick(1)
      }).toThrowContaining('Too much recursion')

            // No additional iterations should happen
      expect(runValues.length).toEqual(5000)
    })

    it('Should keep correct state if a task throws an exception', function () {
      var runValues = new Array
      var func = function (value) {
        runValues.push(value)
      }
      tasks.schedule(func.bind(null, 1))
      tasks.schedule(function () {
        expect(runValues).toEqual([1])
        tasks.runEarly()        // The error will be thrown asynchronously after all tasks are complete
        expect(runValues).toEqual([1, 2])
        tasks.schedule(func.bind(null, 3))
      })
      tasks.schedule(function () {
        throw Error('test')
      })
      tasks.schedule(func.bind(null, 2))
      expect(runValues).toEqual([])

            // It will throw an exception after completing all tasks
      expect(function () {
        jasmine.Clock.tick(1)
      }).toThrow()
      expect(runValues).toEqual([1, 2, 3])
    })
  })
})

describe('Tasks options.taskScheduler', function () {
  if (ieVersion) {
    beforeEach(function () { waits(100) })
        // Workaround for timing-related issues in IE9, where the first few
        // tasks will not actually run asynchronously (and therefore fail).
  }

  it('Should process tasks asynchronously', function () {
    var runCount = 0
    function func () {
      runCount++
    }
    tasks.schedule(func)
    expect(runCount).toEqual(0)

    waits(1)
    runs(function () {
      expect(runCount).toEqual(1)

            // Run a second time
      tasks.schedule(func)
      expect(runCount).toEqual(1)
    })

    waits(1)
    runs(function () {
      expect(runCount).toEqual(2)
    })
  })

  it('Should run only once for a set of tasks', function () {
    var counts = [0, 0]    // scheduler, tasks

    jasmine.Clock.useMock()
    this.restoreAfter(options, 'taskScheduler')
    options.taskScheduler = function (callback) {
      ++counts[0]
      setTimeout(callback, 0)
    }
    function func () {
      ++counts[1]
    }

        // First batch = one scheduler call
    tasks.schedule(func)
    expect(counts).toEqual([1, 0])
    tasks.schedule(func)
    expect(counts).toEqual([1, 0])
    jasmine.Clock.tick(1)
    expect(counts).toEqual([1, 2])

        // Second batch = one scheduler call
    counts = [0, 0]
    tasks.schedule(func)
    tasks.schedule(func)
    jasmine.Clock.tick(1)
    expect(counts).toEqual([1, 2])

        // runEarly doesn't cause any extra scheduler call
    counts = [0, 0]
    tasks.schedule(func)
    expect(counts).toEqual([1, 0])

    tasks.runEarly()
    expect(counts).toEqual([1, 1])

    tasks.schedule(func)
    expect(counts).toEqual([1, 1])

    jasmine.Clock.tick(1)
    expect(counts).toEqual([1, 2])
  })
})
