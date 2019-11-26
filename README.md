# Description

## Upload the local file to the specified directory in the server

# How to install

`npm install -g server-upload`

# Usage

In the project directory, create the `upload.config.js` file

```js
module.exports = {
  server: {
    host: '192.168.1.1',
    port: 22,
    username: 'username',
    password: 'password',
    privateKey: require('fs').readFileSync('/key')
  },
  localPath: '/localPath',
  remotePath: '/home/remotePath'
}
```
Run command `server-upload`