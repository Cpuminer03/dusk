/*
 * Dusk package provider
 */
import axios from 'axios'
import jf from 'jsonfile'
import fs from 'fs'
import os from 'os'
import { promisify } from 'util'
import consola from 'consola'
import path from 'path'
import download from 'download'

// promisify fs functions so we can async/await them later.
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)
const readJson = promisify(jf.readFile)

// caches
let PACKAGES = []
let CUSTOM = []
let CLIENTS = []
let NETWORKS = {
  testnet: {},
  mainnet: {}
}

const platform = async function() {
  try {
    let arch = await os.arch()
    const platform = await os.platform()
    if (arch === 'x64') {
      arch = 'amd64'
    }
    return platform + '-' + arch
  } catch (e) {
    consola.error(new Error(e))
  }
}

const loadPackages = async function(pkgs) {
  try {
    const ls = await readdir(pkgs)
    for (let x of ls) {
      const packagePath = path.join(pkgs, x)
      const duskpkg = await stat(packagePath)
      if (duskpkg.isDirectory()) {
        let pkg = await readJson(path.join(packagePath, 'dusk.json'))
        pkg.path = packagePath.substr(8) + '/' // octano/packageid
        PACKAGES.push(pkg)
        if (pkg.client) {
          const clientData = await getPackageData (
            path.join(packagePath, pkg.client.local),
            'https://github.com/' + pkg.client.remote
          )
          const client = await parseClient(clientData)
          client.duskpkg = {
            path: packagePath.substr(8) + '/',
            id: client.id
          }
          CLIENTS.push(client)
          if (client.networks && client.networks.length > 0) {
            for (let n of client.networks) {
              let type = 'mainnet'
              if (n.testnet) {
                type = 'testnet'
              }
              if (NETWORKS[type][n.networkId]) {
                NETWORKS[type][n.networkId].clients.push(client.id)
              } else {
                n.clients = [ client.id ]
                n.duskpkg = {
                  path: packagePath.substr(8) + '/',
                  id: client.id
                }
                NETWORKS[type][n.networkId] = n
              }
            }
          }
        }
        return
      } else {
        consola.error('path not found: ' + packagePath)
      }
    }
  } catch (e) {
    consola.error(new Error(e))
  }
}

const parseClient = async function(json) {
  try {
    let client = json
    const build = await platform()
    client.platform = build
    client.downloaded = 0
    let releases = []
    for(let y in client.releases) {
      let release = client.releases[y]
      if (release[build]){
        releases.push({
          version: release.version,
          status: 0,
          maxHeight: release.maxHeight,
          tag: release.tag,
          note: release.note,
          download: release[build]
        })
      }
    }
    client.releases = releases
    return client
  } catch (e) {
    consola.error(new Error(e))
    return
  }
}

/* getPackageData
 * fetch data from remote json or use local copy as a fallback
 * injects source (remote/local) and returns json data as object
 */
const getPackageData = async function(localPath, remotePath) {
  try {
    let remote = await axios.get(remotePath)
    if (remote && remote.data) { remote.data.source = 'remote' }
    return remote.data || {}
  } catch (e) {
    try {
      const localJson = await stat(localPath)
      if (localJson.isFile()) {
        let local = await readJson(localPath)
        if (local) { local.source = 'local' }
        return local || {}
      } else {
        consola.error('localPath is not a file (expected json): ' + localPath)
      }
    } catch (e) {
      consola.error(new Error(e))
      return
    }
  }
}

export default {
  // clear all caches
  clear() {
    PACKAGES = [],
    CUSTOM = [],
    CLIENTS = [],
    NETWORKS = []
  },
  // return caches
  get() {
    return {
      octano: PACKAGES,
      custom: CUSTOM,
      clients: CLIENTS,
      networks: NETWORKS
    }
  },
  // set caches
  async set(rootPath) { // './packages'
    try {
      // check packages (rootPath) directory exists
      const pkgs = await stat(rootPath)
      if (pkgs.isDirectory()) {
        // set paths
        const octanoPath = path.join(rootPath, 'octano')
        const customPath = path.join(rootPath, 'custom')
        // check packages/octano directory exists
        const octano = await stat(octanoPath)
        if (octano.isDirectory()) {
          // load packages
          await loadPackages(octanoPath)
        } else {
          consola.error('octano packages path not found: ' + octanoPath)
        }
        // check packages/octano directory exists
        const custom = await stat(customPath)
        if (custom.isDirectory()) {
          // load packages
          await loadPackages(customPath)
        } else {
          consola.error('custom packages path not found: ' + customPath)
        }
      } else {
        consola.error('packages path not found: ' + rootPath)
      }
    } catch (e) {
      consola.error(new Error(e))
    }
  },
  async downloadRelease(release) {
    // check release object/set vars
    // persist/auth
    // persist/binaries/go-ubiq/3.0.1/gubiq
    await download()
  }
}
