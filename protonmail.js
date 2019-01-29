const ProtonMail = require('protonmail-api')

module.exports = function (RED) {
  function ProtonMailNode (config) {
    RED.nodes.createNode(this, config)
    const node = this

    if (node.credentials && node.credentials.hasOwnProperty('username')) {
      node.username = node.credentials.username
    }

    if (node.credentials && node.credentials.hasOwnProperty('password')) {
      node.password = node.credentials.password
    }

    node.on('input', async function (msg) {
      if (!msg.hasOwnProperty('payload')) {
        node.status({ fill: 'yellow', shape: 'dot', text: 'protonmail.status.nopayload' })
        node.warn(RED._('protonmail.errors.nopayload'))
        return
      }
      if (!node.hasOwnProperty('username')) {
        node.status({ fill: 'yellow', shape: 'dot', text: 'protonmail.status.nousername' })
        node.warn(RED._('protonmail.errors.nousername'))
        return
      }
      if (!node.hasOwnProperty('password')) {
        node.status({ fill: 'yellow', shape: 'dot', text: 'protonmail.status.nopassword' })
        node.warn(RED._('protonmail.errors.nopassword'))
        return
      }
      if (msg.to && node.name && (msg.to !== node.name)) {
        node.warn(RED._('node-red:common.errors.nooverride'))
      }

      const emailData = {}
      emailData.body = msg.payload
      emailData.subject = msg.topic || msg.title || RED._('protonmail.default.subject')
      emailData.to = node.name || msg.to
      emailData.cc = msg.cc
      emailData.bcc = msg.bcc

      let pm
      node.status({ fill: 'blue', shape: 'ring', text: 'protonmail.status.connecting' })
      try {
        pm = await ProtonMail.connect({
          username: node.username,
          password: node.password
        })
      } catch (error) {
        node.status({ fill: 'red', shape: 'ring', text: 'protonmail.status.unabletoconnect' })
        node.error(error, msg)
        return
      }

      node.status({ fill: 'blue', shape: 'dot', text: 'protonmail.status.sending' })
      try {
        await pm.sendEmail(emailData)
      } catch (error) {
        node.status({ fill: 'red', shape: 'ring', text: 'protonmail.status.sendfailed' })
        node.error(error, msg)
        return
      } finally {
        pm.close()
      }

      node.status({})
    })
  }

  RED.nodes.registerType('protonmail', ProtonMailNode, {
    credentials: {
      username: { type: 'text' },
      password: { type: 'password' }
    }
  })
}
