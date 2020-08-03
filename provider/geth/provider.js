import net from 'net'
import { Admin } from 'web3-eth-admin'
import Web3 from 'web3'
import consola from 'consola'
import NanoTimer from 'nanotimer'

import BlockCache from './lib/blocks.js'
import PeerCache from './lib/peers.js'
import Loop from '../lib/loop.js'

class Provider {
  constructor(id, interval) {
    this.id = id
    this.interval = interval
    this.timer = new NanoTimer()
  }
}

class GethProvider extends Provider {
  constructor(ipcPath, id, interval) {
    consola.log(ipcPath)
    super(id, interval)
    this.ipcPath = ipcPath
    this.web3 = new Web3(ipcPath, net)
    this.web3Admin = new Admin(ipcPath, net)
    this.blockCache = BlockCache.new(100) // 100 blocks
    this.peerCache = PeerCache.new(86400) // 1day
    this.set = function() {
      const self = this
      this.web3.eth.getBlock('pending', true, function(err, head) {
        if (err || !head) {
          consola.fatal(new Error(err))
          return
        } else {
          const cache = []
          self.blockCache.pending = head
          const blockNumber = head.number - self.blockCache.maxlen * 2
          Loop.sync(
            self.blockCache.maxlen * 2 + 1,
            function(loop) {
              const i = loop.iteration()
              self.web3.eth.getBlock(blockNumber + i, false, function(
                err,
                block
              ) {
                if (!err && block) {
                  cache.push(block)
                  loop.next()
                } else {
                  loop.break(true)
                  loop.next()
                }
              })
            },
            function() {
              self.blockCache.setBlocks(cache, function() {
                return
              })
            }
          )
        }
      })
    }
    this.get = function() {
      return {
        blocks: this.blockCache.cache.values().reverse(),
        pending: this.blockCache.pending,
        peers: this.peerCache.cache.values(),
        localhost: this.peerCache.localhost
      }
    }
  }
}

export default {
  new(ipcPath, instanceId, pollingInterval) {
    return new GethProvider(ipcPath, instanceId, pollingInterval)
  }
}
