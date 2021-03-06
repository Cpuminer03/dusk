import axios from 'axios'
import consola from 'consola'
import sha256 from 'crypto-js/sha256'

export const state = () => ({
  version: '0.1.0',
  system: {},
  packages: {},
  instances: [],
  logs: {},
  downloading: {
    client: null,
    version: null,
    status: false,
    download: {
      percent: 0,
      transferred: 0,
      total: 0
    }
  },
  sync: {
    instances: false,
    system: false
  },
  providers: {}
})

export const mutations = {
  SET_INSTANCES(state, data) {
    state.instances = data
  },
  SET_INSTANCE_STATE(state, instance) {
    for (const i in state.instances) {
      if (state.instances[i].id === instance.id) {
        state.instances[i].supervisor.state = instance.status
      }
    }
  },
  SET_INSTANCE_LOGS(state, data) {
    state.logs[data.id] = data.logs
  },
  SET_PROVIDER(state, provider) {
    state.providers[provider.id] = provider.data
  },
  DEL_PROVIDER(state, provider) {
    delete state.providers[provider.id]
  },
  SET_SYSTEMINFO(state, data) {
    state.system = data
  },
  SET_PACKAGES(state, data) {
    state.packages = data
  },
  SET_DOWNLOADING(state, data) {
    state.downloading = data
  },
  INIT_DOWNLOADING(state, data) {
    state.downloading = data
  },
  ADD_INSTANCE(state, data) {
    state.instances.push(data)
  },
  SET_RIGHT_DRAWER(state, data) {
    state.sync.system = data
  }
}

export const actions = {
  rightdrawer({ commit }, payload) {
    commit('SET_RIGHT_DRAWER', payload)
  },
  async instances({ commit }) {
    try {
      const { data } = await axios.get('/api/instances/get')
      commit('SET_INSTANCES', data.info)
    } catch (error) {
      consola.error(new Error(error))
    }
  },
  async addInstance({ commit }, instance) {
    try {
      if (instance.id) {
        // instance already has id, update existing.
        const { data } = await axios.post('/api/instance/update', instance)
        if (data.success && data.info) {
          commit('SET_INSTANCES', data.info)
        }
      } else {
        // new instance.
        instance.timestamp = Date.now()
        instance.id = await sha256(
          instance.name + instance.timestamp.toString()
        )
          .toString()
          .substr(0, 8)
        // temporarily stage instances.
        const staged = instance
        staged.supervisor = { state: 9000 }
        commit('ADD_INSTANCE', staged)
        const { data } = await axios.post('/api/instance/add', instance)
        if (data.success && data.info) {
          commit('SET_INSTANCES', data.info)
        }
      }
    } catch (error) {
      consola.error(new Error(error))
    }
  },
  async removeInstance({ commit }, payload) {
    try {
      const { data } = await axios.post('/api/instance/remove', payload)
      if (data.success && data.info) {
        commit('SET_INSTANCES', data.info)
      }
    } catch (error) {
      consola.error(new Error(error))
    }
  },
  async startInstance({ commit }, instanceId) {
    try {
      commit('SET_INSTANCE_STATE', { id: instanceId.id, status: 10 })
      const { data } = await axios.post('/api/instance/start', instanceId)
      if (data.success && data.instances) {
        commit('SET_INSTANCES', data.instances)
      }
    } catch (error) {
      consola.error(new Error(error))
    }
  },
  async stopInstance({ commit }, instanceId) {
    try {
      commit('SET_INSTANCE_STATE', { id: instanceId.id, status: 40 })
      const { data } = await axios.post('/api/instance/stop', instanceId)
      if (data.success && data.instances) {
        commit('SET_INSTANCES', data.instances)
      }
    } catch (error) {
      consola.error(new Error(error))
    }
  },
  async getInstanceLogs({ commit }, instanceId) {
    try {
      if (instanceId && instanceId.id) {
        const { data } = await axios.post('/api/instance/logs', instanceId)
        if (data.logs) {
          commit('SET_INSTANCE_LOGS', { id: instanceId.id, logs: data.logs })
        }
      } else {
        commit('SET_INSTANCE_LOGS', { id: instanceId.id, logs: null }) // reset
      }
    } catch (error) {
      consola.error(new Error(error))
    }
  },
  async system({ commit }) {
    try {
      const { data } = await axios.get('/api/system')
      commit('SET_SYSTEMINFO', data.info)
    } catch (error) {
      consola.error(new Error(error))
    }
  },
  async packages({ commit }) {
    try {
      const { data } = await axios.get('/api/packages')
      commit('SET_PACKAGES', data.info)
    } catch (error) {
      consola.error(new Error(error))
    }
  },
  async download({ commit }, payload) {
    try {
      await axios.post('/api/download', {
        client: payload.client,
        version: payload.version
      })

      commit('INIT_DOWNLOADING', {
        client: payload.client,
        version: payload.version,
        status: true,
        download: {
          percent: 0,
          transferred: 0,
          total: 0
        }
      })
    } catch (error) {
      consola.error(new Error(error))
    }
  },
  async downloading({ commit }) {
    try {
      const { data } = await axios.get('/api/downloading')
      if (data.info && data.info.status !== undefined) {
        commit('SET_DOWNLOADING', data.info)
      }
    } catch (error) {
      consola.error(new Error(error))
    }
  },
  async downloadComplete({ commit }) {
    // reset download state
    try {
      await axios.post('/api/resetdownload')
    } catch (error) {
      consola.error(new Error(error))
    }
  },
  async getProvider({ commit, state }, payload) {
    try {
      if (payload && state.providers[payload.id]) {
        // update provider
        const { data } = await axios.post('/api/provider/get', {
          id: payload.id
        })
        if (data.success && data.provider) {
          commit('SET_PROVIDER', { id: payload.id, data: data.provider })
        }
        // set provider
      } else if (payload) {
        consola.log('action')
        consola.log(payload.client)
        // create provider
        const { data } = await axios.post('/api/provider/create', {
          id: payload.id,
          ipc: payload.config.datadir + '/' + payload.client.ipc,
          type: payload.client.provider
        })
        if (data.success && data.provider) {
          commit('SET_PROVIDER', { id: payload.id, data: data.provider })
        }
        // set provider
      }
    } catch (error) {
      consola.error(new Error(error))
    }
  },
  async stopProvider({ commit, state }, payload) {
    try {
      if (payload && state.providers[payload.id]) {
        const { data } = await axios.post('/api/provider/stop', {
          id: payload.id
        })
        if (data.success) {
          commit('DEL_PROVIDER', { id: payload.id })
        }
      }
    } catch (error) {
      consola.error(new Error(error))
    }
  }
}
