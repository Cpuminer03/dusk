import axios from 'axios'
import consola from 'consola'

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
  version: '0.0.1'
})

export const mutations = {
  SET_USER(state, authed) {
    state.authenticated = authed
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
  }
}

export const actions = {
  async system({ commit }) {
    try {
      const { data } = await axios.get('/api/system')
      commit('SET_SYSTEMINFO', data.info)
    } catch (error) {
      if (error.response && error.response.status === 401) {
        consola.error(new Error('Bad credentials'))
      }
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
        clientId: payload.clientId,
        version: payload.version
      })
      commit('INIT_DOWNLOADING', {
        client: payload.clientName,
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
    const downloading = {
      client: null,
      version: null,
      status: false,
      download: {
        percent: 0,
        transferred: 0,
        total: 0
      }
    }

    try {
      await axios.post('/api/resetdownload', { downloading })
      commit('INIT_DOWNLOADING', downloading)
    } catch (error) {
      consola.error(new Error(error))
    }
  }
}
