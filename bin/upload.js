#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const Client = require('ssh2').Client
const conn = new Client()
const findup = require('findup-sync')
;(function() {
  let time = +new Date()
  // 获取配置文件
  pathToUpload = findup('upload.config.js')
  const { server, remotePath, localPath } = require(pathToUpload)
  conn
    .on('ready', async () => {
      console.log('客户端准备')
      try {
        // 删除服务器指定目录,创建新的目录
        await exec(
          conn,
          `sudo rm -rf ${remotePath} && sudo mkdir ${remotePath} && sudo chmod 777 ${remotePath}`
        )
        console.log('删除服务器指定目录成功')
        // 获取本地目录下的文件地址和目录地址
        let { list, dirList } = readAllFile(localPath)
        dirList.delete('')
        // 在服务器创建指定目录下需要的目录文件
        for (let item of dirList) {
          await exec(
            conn,
            `sudo mkdir ${remotePath}${item} && sudo chmod 777 ${remotePath}${item}`
          )
        }
        console.log('开始上传文件')
        // 上传本地文件到服务器
        for (let i = 0; i < list.length; i++) {
          await upload(conn, list[i].localPath, remotePath + list[i].fileName)
        }
        console.log(
          '所有文件上传成功 用时: ' + (+new Date() - time) / 1000 + 's'
        )
        conn.end()
      } catch (err) {
        console.error(err)
        conn.end()
      }
    })
    .connect(server)
})()
// 执行命令
function exec(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) {
        reject(err)
        return
      }
      stream
        .on('close', function(code, signal) {
          if (code === 0) {
            resolve()
          } else {
            if (signal) console.log(signal)
            reject(code)
          }
        })
        .on('data', function(data) {
          console.log('STDOUT: ' + data)
        })
        .stderr.on('data', function(data) {
          console.log('STDERR: ' + data)
        })
    })
  })
}
// 上传文件
function upload(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) {
        reject(err)
        return
      }
      sftp.fastPut(localPath, remotePath, (err, result) => {
        sftp.end()
        if (err) {
          reject(err)
          return
        }
        resolve(result)
      })
    })
  })
}
// 查找目录下所有文件的地址
function readAllFile(localPath) {
  let list = []
  let initPath = ''
  let dirList = new Set()
  readFile(localPath, list, initPath)
  return {
    list,
    dirList
  }
  function readFile(localPath, list, initPath) {
    fs.readdirSync(localPath).map(fileName => {
      let childPath = path.join(localPath, fileName)
      let filePath = initPath + '/' + fileName
      dirList.add(initPath)
      if (fs.statSync(childPath).isDirectory()) {
        readFile(childPath, list, filePath)
      } else {
        list.push({
          localPath: childPath,
          fileName: filePath
        })
      }
    })
  }
}
