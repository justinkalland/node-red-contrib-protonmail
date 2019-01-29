const expect = require('chai').expect
const waitFor = require('p-wait-for')
const helper = require('node-red-node-test-helper')
const protonmail = require('../protonmail')
const ProtonMailApi = require('protonmail-api')

helper.init(require.resolve('node-red'))

function load (testNode, testFlow, testCredentials = {}) {
  return new Promise((resolve, reject) => {
    helper.load(testNode, testFlow, testCredentials, resolve)
  })
}

function eventOnce (node, event) {
  return new Promise((resolve, reject) => {
    node.once(event, resolve)
  })
}

describe('protonmail', () => {
  beforeEach(() => {
    helper._sandbox.spy(ProtonMailApi, 'connect')
  })

  afterEach(() => {
    helper.unload()
  })

  it('errors on missing payload', async () => {
    await load(protonmail, [
      { id: 'n1', type: 'protonmail' }
    ])

    const n1 = helper.getNode('n1')

    n1.receive()
    await eventOnce(n1, 'call:warn')

    expect(n1.status.lastCall.lastArg.text).to.equal('protonmail.status.nopayload')
    expect(n1.warn.lastCall.lastArg).to.equal('protonmail.errors.nopayload')
    expect(ProtonMailApi.connect.called).to.equal(false)
  })

  it('errors on missing username', async () => {
    await load(protonmail, [
      { id: 'n1', type: 'protonmail' }
    ])

    const n1 = helper.getNode('n1')

    n1.receive({ payload: 'foobar' })
    await eventOnce(n1, 'call:warn')

    expect(n1.status.lastCall.lastArg.text).to.equal('protonmail.status.nousername')
    expect(n1.warn.lastCall.lastArg).to.equal('protonmail.errors.nousername')
    expect(ProtonMailApi.connect.called).to.equal(false)
  })

  it('errors on missing password', async () => {
    await load(protonmail, [
      { id: 'n1', type: 'protonmail' }
    ], {
      n1: { username: 'foobar' }
    })
    const n1 = helper.getNode('n1')

    n1.receive({ payload: 'foobar' })
    await eventOnce(n1, 'call:warn')

    expect(n1.status.lastCall.lastArg.text).to.equal('protonmail.status.nopassword')
    expect(n1.warn.lastCall.lastArg).to.equal('protonmail.errors.nopassword')
    expect(ProtonMailApi.connect.called).to.equal(false)
  })

  it('errors on problem connecting', async () => {
    helper._sandbox.stub(ProtonMailApi.prototype, '_connect').throws()

    await load(protonmail, [
      { id: 'n1', type: 'protonmail' }
    ], {
      n1: { username: 'foobar', password: 'baz' }
    })
    const n1 = helper.getNode('n1')

    n1.receive({ payload: 'foobar' })
    await eventOnce(n1, 'call:error')

    expect(ProtonMailApi.connect.called).to.equal(true)
    expect(n1.status.lastCall.lastArg.text).to.equal('protonmail.status.unabletoconnect')
  })

  it('errors on problem sending', async () => {
    helper._sandbox.stub(ProtonMailApi.prototype, '_connect')
    helper._sandbox.stub(ProtonMailApi.prototype, 'sendEmail').throws()
    const closeStub = helper._sandbox.stub(ProtonMailApi.prototype, 'close')

    await load(protonmail, [
      { id: 'n1', type: 'protonmail' }
    ], {
      n1: { username: 'foobar', password: 'baz' }
    })
    const n1 = helper.getNode('n1')

    n1.receive({ payload: 'foobar' })
    await eventOnce(n1, 'call:error')

    expect(ProtonMailApi.connect.called).to.equal(true)
    expect(closeStub.called).to.equal(true)
    expect(n1.status.lastCall.lastArg.text).to.equal('protonmail.status.sendfailed')
  })

  it('mock sends', async () => {
    helper._sandbox.stub(ProtonMailApi.prototype, '_connect')
    const sendStub = helper._sandbox.stub(ProtonMailApi.prototype, 'sendEmail')
    const closeStub = helper._sandbox.stub(ProtonMailApi.prototype, 'close')

    await load(protonmail, [
      { id: 'n1', type: 'protonmail' }
    ], {
      n1: { username: 'foobar', password: 'baz' }
    })
    const n1 = helper.getNode('n1')

    n1.receive({ payload: 'foobar' })
    await waitFor(() => closeStub.called)

    expect(ProtonMailApi.connect.called).to.equal(true)
    expect(closeStub.called).to.equal(true)
    expect(sendStub.called).to.equal(true)
    expect(n1.status.callCount).to.equal(3)
  })

  it('sets default subject if missing', async () => {
    helper._sandbox.stub(ProtonMailApi.prototype, '_connect')
    helper._sandbox.stub(ProtonMailApi.prototype, 'close')
    let emailData
    const sendStub = helper._sandbox.stub(ProtonMailApi.prototype, 'sendEmail').callsFake(data => {
      emailData = data
    })

    await load(protonmail, [
      { id: 'n1', type: 'protonmail' }
    ], {
      n1: { username: 'foobar', password: 'baz' }
    })
    const n1 = helper.getNode('n1')

    n1.receive({ payload: 'foobar' })
    await waitFor(() => sendStub.called)

    expect(emailData.subject).to.equal('protonmail.default.subject')
  })

  it('sets to from node name', async () => {
    helper._sandbox.stub(ProtonMailApi.prototype, '_connect')
    helper._sandbox.stub(ProtonMailApi.prototype, 'close')
    let emailData
    const sendStub = helper._sandbox.stub(ProtonMailApi.prototype, 'sendEmail').callsFake(data => {
      emailData = data
    })

    await load(protonmail, [
      { id: 'n1', type: 'protonmail', name: 'test@bar.baz' }
    ], {
      n1: { username: 'foobar', password: 'baz' }
    })
    const n1 = helper.getNode('n1')

    n1.receive({ payload: 'foobar' })
    await waitFor(() => sendStub.called)

    expect(emailData.to).to.equal('test@bar.baz')
  })

  it('sets to from message', async () => {
    helper._sandbox.stub(ProtonMailApi.prototype, '_connect')
    helper._sandbox.stub(ProtonMailApi.prototype, 'close')
    let emailData
    const sendStub = helper._sandbox.stub(ProtonMailApi.prototype, 'sendEmail').callsFake(data => {
      emailData = data
    })

    await load(protonmail, [
      { id: 'n1', type: 'protonmail' }
    ], {
      n1: { username: 'foobar', password: 'baz' }
    })
    const n1 = helper.getNode('n1')

    n1.receive({ payload: 'foobar', to: 'bar@foo.com' })
    await waitFor(() => sendStub.called)

    expect(emailData.to).to.equal('bar@foo.com')
  })

  it('ignores to in message if name of node is set', async () => {
    helper._sandbox.stub(ProtonMailApi.prototype, '_connect')
    helper._sandbox.stub(ProtonMailApi.prototype, 'close')
    let emailData
    const sendStub = helper._sandbox.stub(ProtonMailApi.prototype, 'sendEmail').callsFake(data => {
      emailData = data
    })

    await load(protonmail, [
      { id: 'n1', type: 'protonmail', name: 'test@bar.baz' }
    ], {
      n1: { username: 'foobar', password: 'baz' }
    })
    const n1 = helper.getNode('n1')

    n1.receive({ payload: 'foobar', to: 'bar@foo.com' })
    await waitFor(() => sendStub.called)

    expect(emailData.to).to.equal('test@bar.baz')
    expect(n1.warn.lastCall.lastArg).to.equal('node-red:common.errors.nooverride')
  })
})
