# node-red-contrib-protonmail
A [Node-RED](https://nodered.org/) node to send email through [ProtonMail](https://protonmail.com). Uses the official WebClient through the [protonmail-api](https://github.com/justinkalland/protonmail-api).

# Install
Use npm to install this package locally in the Node-RED data directory (by default, `~/.node-red`):

```
cd ~/.node-red
npm install node-red-contrib-protonmail
```

# Usage
This project aims to provide the same functionality as the official [node-red-node-email](https://flows.nodered.org/node/node-red-node-email). See included help section in Node-RED for more details.

# Help
Best place to ask is in the GitHub [issues](https://github.com/justinkalland/node-red-contrib-protonmail/issues).

# Contributing
If there is demand for additional functionality (such as attachments or receiving emails) please [add an issue](https://github.com/justinkalland/node-red-contrib-protonmail/issues/new).

If contributing code please remember to add new tests and run existing tests.
```
npm test
```