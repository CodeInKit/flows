import { Flows } from '../src/index';
import { ActionData } from '../src/index';


describe('flow test', () => {
  it('should register flow', () => {
    const flows = new Flows();

    flows.register('test_flow', []);
    const flowsMap = (flows as any).flows;
    
    expect(flowsMap.has('test_flow')).toBeTruthy();
    expect(flowsMap.get('test_flow')).toHaveLength(0);
  });

  it('should return initial data on empty flow', async () => {
    const flows = new Flows();
    flows.register('test_flow', []);

    const response = await flows.execute('test_flow', {initial: true} as ActionData);
    expect(response).toMatchObject({initial: true});
  });

  it('should execute flow', async () => {
    const flows = new Flows();
    flows.register('test_flow', [(data) => ({...data, other: true})]);

    const response = await flows.execute('test_flow', {initial: true} as ActionData);
    expect(response).toMatchObject({initial: true, other: true});
  });

  it('should wait on async action', async () => {
    const flows = new Flows();
    flows.register('test_flow', [(data) => new Promise((resolve) => {
      setTimeout(() => resolve({...data, other: true} as ActionData), 1);
    })]);

    const response = await flows.execute('test_flow', {initial: true} as ActionData);
    expect(response).toMatchObject({initial: true, other: true});
  });

  it('should jump to other flow on change metadata', async () => {
    const flows = new Flows();
    flows.register('test_flow', [(data) => ({...data, __flows: {jump:'other_flow'}})]);
    flows.register('other_flow', [(data) => ({...data, other: true})]);

    const response = await flows.execute('test_flow', {initial: true} as ActionData);
    expect(response).toMatchObject({initial: true, other: true});
  });

  it('should finish flow on done', async () => {
    const flows = new Flows();
    flows.register('test_flow', [(data) => ({...data, other: true, __flows: {done: true}}), (data) => ({...data, other2: true})]);

    const response = await flows.execute('test_flow', {initial: true} as ActionData);
    expect(response).not.toMatchObject({other2: true});
  });

  it('should run pre_flow hook only once before the flow start', async () => {
    const hook = jest.fn(() => {});
    const flows = new Flows();
    flows.register('test_flow', [(data) => ({...data, other: true}), (data) => ({...data, other2: true})]);
    flows.hook('pre_flow', hook);
    
    await flows.execute('test_flow', {initial: true} as ActionData);
    expect(hook).toBeCalledTimes(1);
  });

  it('should run post_flow hook only once after the flow ends', async () => {
    const hook = jest.fn(() => {});
    const flows = new Flows();
    flows.register('test_flow', [(data) => ({...data, other: true}), (data) => ({...data, other2: true})]);
    flows.hook('post_flow', hook);
    
    await flows.execute('test_flow', {initial: true} as ActionData);
    expect(hook).toBeCalledTimes(1);
  });

  it('should run pre_action hook before each action', async () => {
    const hook = jest.fn(() => {});
    const flows = new Flows();
    const flowToTest = [(data: ActionData) => ({...data, other: true}), (data: ActionData) => ({...data, other2: true})];
    flows.register('test_flow', flowToTest);
    flows.hook('pre_action', hook);
    
    await flows.execute('test_flow', {initial: true} as ActionData);
    expect(hook).toBeCalledTimes(flowToTest.length);
  });

  it('should run post_action hook after each action', async () => {
    const hook = jest.fn(() => {});
    const flows = new Flows();
    const flowToTest = [(data: ActionData) => ({...data, other: true}), (data: ActionData) => ({...data, other2: true})];
    flows.register('test_flow', flowToTest);
    flows.hook('post_action', hook);
    
    await flows.execute('test_flow', {initial: true} as ActionData);
    expect(hook).toBeCalledTimes(flowToTest.length);
  });
});