'use strict';

const Writable = require('stream').Writable;

const LINE_BUFFER = Buffer.from('\r\n');

class FileStream extends Writable {

  constructor(boundary, cb) {
    super({
      objectMode: true
    });
    this._boundary = boundary;
    this._cb = cb;
  }

  _write(__newFile, _unused, done) {
    this._cb(Buffer.from(this._boundary, 'utf-8'));
    this._cb(LINE_BUFFER);
    const headers = __newFile.headers;
    this._cb(Buffer.from('Content-Disposition: ' + headers['content-disposition'], _unused));
    delete headers['content-disposition'];
    Object.keys(headers).map(key => {
      this._cb(LINE_BUFFER);
      this._cb(Buffer.from(key + ': ' + headers[key], _unused));
    });
    this._cb(LINE_BUFFER);
    this._cb(LINE_BUFFER);
    __newFile.on('data', (chunk) => {
      this._cb(chunk);
    });
    __newFile.on('end', (chunk) => {
      if (chunk) {
        this._cb(chunk);
      }
      this._cb(LINE_BUFFER);
      done();
    });
  }
}

module.exports = FileStream;