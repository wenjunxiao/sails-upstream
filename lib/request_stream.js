'use strict';

const format = require('util').format;
const Readable = require('stream').Readable;
const querystring = require('querystring');

const FileStream = require('./file_stream.js');
const LINE_BUFFER = Buffer.from('\r\n');

class RequestStream extends Readable {
  constructor(req, options) {
    super(options);
    this._req = req;
    this._initBuffer = null;
    this._endBuffer = null;
    this._started = false;
    if (/multipart\/form-data;\s*boundary\s*=\s*(.*)$/.test(req.headers['content-type'])) {
      const boundary = this._boundary = '--' + RegExp.$1;
      const body = req.body || {};
      const data = [];
      Object.keys(body).map(field => {
        data.push(Buffer.from(format('%s\r\nContent-Disposition: form-data; name="%s"\r\n\r\n%s', boundary, field, body[field]), 'utf-8'));
        data.push(LINE_BUFFER);
      });
      this._initBuffer = Buffer.concat(data);
      this._endBuffer = Buffer.from(format('%s--', boundary), 'utf-8');
    } else if (req.is('application/x-www-form-urlencoded')) {
      this._initBuffer = req.body && Buffer.from(querystring.stringify(req.body), 'utf-8');
    } else {
      this._initBuffer = req.body && Buffer.from(JSON.stringify(req.body), 'utf-8');
    }
    this.on('__start', this.__start);
  }

  __readUpstreams(upstreams) {
    const up = upstreams.shift();
    if (!up) return Promise.resolve();
    return new Promise((resolve, reject) => {
      up.pipe(new FileStream(this._boundary, (buffer) => {
        if (buffer) this.push(buffer);
      })).on('finish', () => {
        resolve(this.__readUpstreams(upstreams));
      }).on('error', (err)=> {
        reject(err);
      });
    })
  }

  __start() {
    if (this._initBuffer) this.push(this._initBuffer);
    const upstreams = this._req._fileparser && this._req._fileparser.upstreams;
    if (upstreams) {
      this.__readUpstreams(upstreams).then(() => {
        this.push(this._endBuffer);
        if (this._endBuffer) this.push(null);
      });
    } else {
      this.push(this._endBuffer);
      if (this._endBuffer) this.push(null);
    }
  }

  _read(size) {
    if (this._started) return;
    this._started = true;
    this.emit('__start');
  }
}

module.exports = RequestStream;
