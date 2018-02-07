# sails-upstream

[![NPM version](https://img.shields.io/npm/v/sails-upstream.svg?style=flat-square)](https://www.npmjs.com/package/sails-upstream)
[![Downloads](http://img.shields.io/npm/dm/sails-upstream.svg?style=flat-square)](https://npmjs.org/package/sails-upstream)

  Convert sails request `req` to stream, which can be used to pipe body (include file uploaded) to other request,
  such as `http-proxy`.

## Install

```bash
$ npm install sails-upstream --save
```

## Usage

  Proxy request.
```js
// api/policies/upstream.js
const httpProxy = require('http-proxy');
const {RequestStream} = require('sails-upstream');

const proxy = httpProxy.createProxyServer({});

module.exports = (req, res, next) {
  proxy.web(req, res, {target: target, ws: true, buffer: new RequestStream(req)});
};
```

  Upload file to buffer.
```js
// api/controller/TestController.js
const httpProxy = require('http-proxy');
const {fileBuffer} = require('sails-upstream');

module.exports = {
  async test(req, res){
    const buffer = await fileBuffer(req.file('file'));
  }
};
```
