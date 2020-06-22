import axios from 'axios'
import consola from 'consola'
import sha256 from 'crypto-js/sha256'

export const state = () => ({
  drawers: {
    right: true
  },
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
  system: {},
  packages: {},
  instances: [],
  version: '0.0.1'
})

export const mutations = {
  SET_USER(state, authed) {
    state.authenticated = authed
  },
  SET_INSTANCES(state, data) {
    state.instances = data
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
  }
}

export const actions = {
  async instances({ commit }) {
    try {
      const { data } = await axios.get('/api/instances/get')
      commit('SET_INSTANCES', data.info)
    } catch (error) {
      consola.error(new Error(error))
    }
  },
  async addNewInstance({ commit }, instance) {
    try {
      instance.timestamp = Date.now()
      instance.status = 0
      instance.id = await sha256(instance.name + instance.timestamp.toString())
        .toString()
        .substr(0, 8)
      const res = await axios.post('/api/instance/add', instance)
      if (res.data.success) {
        commit('ADD_INSTANCE', instance)
        return true
      }
    } catch (error) {
      consola.error(new Error(error))
    }
  },
  async removeInstance({ commit }, instanceId) {
    try {
      const res = await axios.post('/api/instance/remove', instanceId)
      if (res.data.success && res.data.info) {
        commit('SET_INSTANCES', res.data.info)
        return true
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
  }
}
