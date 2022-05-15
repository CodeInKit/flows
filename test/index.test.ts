import { Flows, SupportedHooks } from '../src/index'

// @ts-ignore
global.console = { warn: jest.fn() }

describe('flow test', () => {
  it('should register flow', () => {
    const flows = new Flows()

    flows.register('test_flow', [])
    const flowsMap = (flows as any).flows

    expect(flowsMap.has('test_flow')).toBeTruthy()
    expect(flowsMap.get('test_flow')).toHaveLength(0)
  })

  it('should return initial data on empty flow', async () => {
    const flows = new Flows()
    flows.register('test_flow', [])

    const response = await flows.execute<{}>('test_flow', { initial: true })
    expect(response).toMatchObject({ initial: true })
  })

  it('should execute flow', async () => {
    const flows = new Flows()
    flows.register('test_flow', [(data) => ({ ...data, other: true })])

    const response = await flows.execute<{}>('test_flow', { initial: true })
    expect(response).toMatchObject({ initial: true, other: true })
  })

  it('should wait on async action', async () => {
    const flows = new Flows()
    flows.register('test_flow', [
      (data) => Promise.resolve({ ...data, other: true }),
    ])

    const response = await flows.execute<{}>('test_flow', { initial: true })
    expect(response).toMatchObject({ initial: true, other: true })
  })

  it('should jump to other flow on change metadata', async () => {
    const flows = new Flows()
    flows.register('test_flow', [
      (data) => ({ ...data, $$: { jump: 'other_flow' } }),
    ])
    flows.register('other_flow', [(data) => ({ ...data, other: true })])

    const response = await flows.execute<{}>('test_flow', { initial: true })
    expect(response).toMatchObject({ initial: true, other: true })
  })

  it('should finish flow on done', async () => {
    const action = jest.fn((data) => ({ ...data, other2: true }))
    const flows = new Flows()

    flows.register('test_flow', [
      (data) => ({ ...data, other: true, $$: { done: true } }),
      action,
    ])

    const response = await flows.execute<{}>('test_flow', { initial: true })
    expect(response).not.toMatchObject({ other2: true })
    expect(action).not.toBeCalled()
  })

  describe('hooks', () => {
    it('should run pre_flow hook only once before the flow start', async () => {
      const hook = jest.fn(() => {})
      const flows = new Flows()

      flows.register('test_flow', [
        (data) => ({ ...data, other: true }),
        (data) => ({ ...data, other2: true }),
      ])
      flows.hook(SupportedHooks.PRE_FLOW, hook)

      await flows.execute<{}>('test_flow', { initial: true })
      expect(hook).toBeCalledTimes(1)
    })

    it('should run post_flow hook only once after the flow ends', async () => {
      const hook = jest.fn(() => {})
      const flows = new Flows()

      flows.register('test_flow', [
        (data) => ({ ...data, other: true }),
        (data) => ({ ...data, other2: true }),
      ])
      flows.hook(SupportedHooks.POST_FLOW, hook)

      await flows.execute<{}>('test_flow', { initial: true })
      expect(hook).toBeCalledTimes(1)
    })

    it('should run pre_action hook before each action', async () => {
      const hook = jest.fn(() => {})
      const flows = new Flows()

      const flowToTest = [
        (data: {}) => ({ ...data, other: true }),
        (data: { other?: boolean }) => ({ ...data, other2: true }),
      ] as const
      flows.register('test_flow', flowToTest)
      flows.hook(SupportedHooks.PRE_ACTION, hook)

      await flows.execute<{}>('test_flow', { initial: true })
      expect(hook).toBeCalledTimes(flowToTest.length)
    })

    it('should run post_action hook after each action', async () => {
      const hook = jest.fn(() => {})
      const flows = new Flows()

      const flowToTest = [
        (data: {}) => ({ ...data, other: true }),
        (data: { other?: boolean }) => ({ ...data, other2: true }),
      ] as const
      flows.register('test_flow', flowToTest)
      flows.hook(SupportedHooks.POST_ACTION, hook)

      await flows.execute<{}>('test_flow', { initial: true })
      expect(hook).toBeCalledTimes(flowToTest.length)
    })

    it('should run exception hook when function throws', async () => {
      const hook = jest.fn(() => {})
      const flows = new Flows()

      flows.register('test_flow', [
        (data) => {
          throw new Error('test exception')
        },
        (data) => ({ ...data, other2: true }),
      ])
      flows.hook(SupportedHooks.EXCEPTION, hook)

      await expect(
        flows.execute<{}>('test_flow', { initial: true })
      ).rejects.toEqual(new Error('test exception'))
      expect(hook).toBeCalledTimes(1)
    })
  })

  it('should throw on cyclic flow', async () => {
    const flows = new Flows()
    flows.register('test_flow', [
      (data) => ({ ...data, $$: { jump: 'other_flow' } }),
    ])
    flows.register('other_flow', [
      (data) => ({ ...data, $$: { jump: 'test_flow' } }),
    ])

    await expect(
      flows.execute<{}>('test_flow', { initial: true })
    ).rejects.toEqual(
      new Error('cyclic flow!!, [test_flow, other_flow, test_flow]')
    )
  })

  it('should keep the requestId to the end of the flow', async () => {
    const flows = new Flows()
    flows.register('test_flow', [
      (data) => ({ ...data, other: true }),
      () => ({ somethingElse: 1 }),
    ])

    const response = await flows.execute<{}>('test_flow', {
      initial: true,
      $$: { requestId: '123' },
    })
    expect(response).toMatchObject({
      somethingElse: 1,
      $$: { requestId: '123' },
    })
  })

  it('should throw if action not returning an object', async () => {
    const flows = new Flows()
    // @ts-ignore
    flows.register('test_flow', [
      (data) => ({ ...data, other: true }),
      () => 'throw me',
    ])

    await expect(
      flows.execute<{}>('test_flow', { initial: true })
    ).rejects.toEqual(
      new Error(
        'in flow test_flow action number 1 return "throw me" instead of object!\nactions must return object'
      )
    )
  })

  it('should throw error when using unknown hook', () => {
    const flows = new Flows()

    function unknownHook() {
      // @ts-ignore
      flows.hook('unknown', () => {})
    }

    expect(unknownHook).toThrowError(
      'Hook unknown is not a known hook, please read the docs regarding acceptable hooks'
    )
  })

  it('should resolve and warn if unknown flow', async () => {
    const flows = new Flows()
    const res = await flows.execute<{}>('unknown', { someData: 1 })

    expect(res).toMatchObject({ someData: 1 })
    expect(console.warn).toBeCalledWith('unknown flow does not exists! Skipped')
  })
})
