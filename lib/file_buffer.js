'use strict';

const Writable = require('stream').Writable;

class FileBuffer extends Writable {

  constructor(cb) {
    super({
      objectMode: true
    });
    this._cb = cb;
  }

  _write(__newFile, encoding, done) {
    const data = [];
    __newFile.on('data', (chunk) => {
      data.push(chunk);
    });
    __newFile.on('end', (chunk) => {
      if (chunk) {
        data.push(chunk);
      }
      this._cb({
        filename: __newFile.filename,
        encoding,
        buffer: Buffer.concat(data)
      });
      done();
    });
  }
}

/**
 * Upload `req.file('name')` to buffer
 * @param file
 * @returns {Promise.<[{buffer, encoding, filename}]>}
 */
module.exports = function fileBuffer(file) {
  return new Promise((resolve, reject) => {
    const files = [];
    file.pipe(new FileBuffer((data) => {
      files.push(data);
    })).on('finish', () => {
      resolve(files);
    }).on('error', (err) => {
      reject(err);
    });
  });
};