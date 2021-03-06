<template>
  <v-container>
    <v-row v-if="!!instance">
      <v-breadcrumbs :items="breadcrumbs"></v-breadcrumbs>
    </v-row>
    <v-row v-if="!!instance" no-gutters>
      <v-list two-line style="width:100%">
        <v-list-item>
          <v-list-item-avatar>
            <img
              :src="require('~/packages' + network.duskpkg.path + network.icon)"
            />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>{{ instance.name }}</v-list-item-title>
            <v-list-item-subtitle>
              {{
                network.name +
                  ' - ' +
                  instance.client.name +
                  ' v' +
                  instance.version
              }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <span v-on="on">
                  <dashboard :instance="instance" />
                </span>
              </template>
              <span>{{ $t('geth.dashboard.title') }}</span>
            </v-tooltip>
          </v-list-item-action>
          <v-list-item-action>
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <span v-on="on">
                  <instance-logs :instance="instance" />
                </span>
              </template>
              <span>{{ $t('logs.title') }}</span>
            </v-tooltip>
          </v-list-item-action>
          <v-list-item-action>
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <span v-on="on">
                  <control-instance :instance="instance" />
                </span>
              </template>
              <span>
                {{
                  instance.supervisor.state === 20
                    ? $t('controls.stop')
                    : $t('controls.start')
                }}
              </span>
            </v-tooltip>
          </v-list-item-action>
          <v-list-item-action>
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <span v-on="on">
                  <destroy-instance
                    :instance="instance"
                    :state="instance.supervisor.state"
                  />
                </span>
              </template>
              <span>{{ $t('destroy.title') }}</span>
            </v-tooltip>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-row>
    <v-tabs v-model="tab" class="details-tabs">
      <v-tab :key="0">
        {{ $t('geth.overview.title') }}
      </v-tab>
      <v-tab :key="1">
        {{ $t('geth.settings.title') }}
      </v-tab>
      <v-tab-item :key="0">
        <v-col v-if="!!instance" :cols="12" class="d-flex pa-0">
          <v-col :cols="6" class="pa-0 pr-1">
            <v-card>
              <v-card-title>{{ $t('geth.overview.details') }}</v-card-title>
              <v-card-text>
                <v-simple-table>
                  <template v-slot:default>
                    <tbody class="text-left">
                      <tr>
                        <th>{{ $t('geth.overview.name') }}</th>
                        <td>{{ instance.name }}</td>
                      </tr>
                      <tr>
                        <th>{{ $t('geth.overview.id') }}</th>
                        <td>{{ instance.id }}</td>
                      </tr>
                      <tr>
                        <th>{{ $t('geth.overview.network') }}</th>
                        <td>{{ network.name }}</td>
                      </tr>
                      <tr>
                        <th>{{ $t('geth.overview.client') }}</th>
                        <td>
                          {{ instance.client.name }} v{{ instance.version }}
                        </td>
                      </tr>
                      <tr>
                        <th>{{ $t('geth.overview.binpath') }}</th>
                        <td>{{ instance.binpath }}</td>
                      </tr>
                      <tr>
                        <th>{{ $t('geth.overview.datadir') }}</th>
                        <td>{{ instance.config.datadir }}</td>
                      </tr>
                      <tr>
                        <th>{{ $t('geth.overview.created') }}</th>
                        <td>{{ new Date(instance.timestamp) }}</td>
                      </tr>
                    </tbody>
                  </template>
                </v-simple-table>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col :cols="6" class="pa-0 pl-1">
            <v-card class="pa-0">
              <v-card-title>{{ $t('geth.overview.supervisor') }}</v-card-title>
              <v-card-text>
                <v-simple-table>
                  <template v-slot:default>
                    <tbody class="text-left">
                      <tr>
                        <th>{{ $t('geth.overview.state') }}</th>
                        <td>{{ instance.supervisor.statename }}</td>
                      </tr>
                      <tr v-if="instance.supervisor.state === 20">
                        <th>{{ $t('geth.overview.uptime') }}</th>
                        <td>
                          {{ formatUptime(instance.supervisor.description) }}
                        </td>
                      </tr>
                      <tr v-else>
                        <th>{{ $t('geth.overview.stoppedAt') }}</th>
                        <td>{{ instance.supervisor.description }}</td>
                      </tr>
                      <tr v-if="instance.supervisor.state === 20">
                        <th>{{ $t('geth.overview.pid') }}</th>
                        <td>{{ instance.supervisor.pid }}</td>
                      </tr>
                      <tr v-else>
                        <th>{{ $t('geth.overview.exitStatus') }}</th>
                        <td>{{ instance.supervisor.exitstatus }}</td>
                      </tr>
                      <tr>
                        <th>{{ $t('geth.overview.group') }}</th>
                        <td>{{ instance.supervisor.group }}</td>
                      </tr>
                      <tr>
                        <th>{{ $t('geth.overview.name') }}</th>
                        <td>{{ instance.supervisor.name }}</td>
                      </tr>
                      <tr>
                        <th>{{ $t('geth.overview.stderr') }}</th>
                        <td>{{ instance.supervisor.stderr_logfile }}</td>
                      </tr>
                      <tr>
                        <th>{{ $t('geth.overview.stdout') }}</th>
                        <td>{{ instance.supervisor.stdout_logfile }}</td>
                      </tr>
                    </tbody>
                  </template>
                </v-simple-table>
              </v-card-text>
            </v-card>
          </v-col>
        </v-col>
      </v-tab-item>
      <v-tab-item :key="1">
        <v-card class="px-1 py-2">
          <v-card-title class="py-1">
            <v-icon class="mx-1">mdi-cogs</v-icon>
            {{ $t('geth.settings.configure') }}
            <v-spacer />
            <v-list>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-subtitle>
                    {{ $t('geth.settings.showAdvanced') }}
                  </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                  <v-switch
                    v-model="showAdvanced"
                    :disabled="showAdvancedDisabled"
                  ></v-switch>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </v-card-title>
          <v-row no-gutters>
            <v-card outlined raised class="ma-1" style="display:inline-block;">
              <v-menu
                bottom
                transition="slide-y-transition"
                origin="top center"
              >
                <template v-slot:activator="{ on }">
                  <v-list two-line class="pa-0" style="background-color:#111">
                    <v-list-item v-on="on">
                      <v-list-item-avatar tile>
                        <img
                          :src="
                            require('~/packages' +
                              instance.client.duskpkg.path +
                              instance.client.icon)
                          "
                        />
                      </v-list-item-avatar>
                      <v-list-item-content>
                        <v-list-item-title>
                          {{ instance.client.name }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                          v{{ release.version }}
                        </v-list-item-subtitle>
                      </v-list-item-content>
                      <v-list-item-action>
                        <v-icon color="grey lighten-1">mdi-menu-down</v-icon>
                      </v-list-item-action>
                    </v-list-item>
                  </v-list>
                </template>
                <v-list>
                  <template v-for="(r, i) in client.releases">
                    <v-list-item
                      v-if="r.status > 0"
                      :key="i"
                      @click="release = r"
                    >
                      <v-list-item-title>
                        v{{ r.version }} - {{ r.tag }}
                      </v-list-item-title>
                    </v-list-item>
                  </template>
                  <v-divider />
                  <v-list-item @click="$router.push({ path: '/clients' })">
                    <v-list-item-content>
                      <v-list-item-subtitle>
                        {{ $t('geth.settings.downloads') }}
                      </v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-card>
          </v-row>
        </v-card>
        <geth-settings
          v-if="!!instance && !!network && !!release"
          :client="client"
          :engine="network.engine"
          :release="release"
          :network="network"
          :show-advanced="showAdvanced"
          :default-options="instance.config"
          :value="instance"
        />
      </v-tab-item>
    </v-tabs>
  </v-container>
</template>

<script>
import GethSettings from '~/components/forms/gethSettings'
import Dashboard from '@/components/actions/dialogs/Dashboard'
import DestroyInstance from '@/components/actions/dialogs/DestroyInstance'
import ControlInstance from '@/components/actions/ControlInstance'
import InstanceLogs from '@/components/actions/dialogs/Logs'

export default {
  middleware: 'auth',
  name: 'Instance',
  components: {
    ControlInstance,
    Dashboard,
    DestroyInstance,
    GethSettings,
    InstanceLogs
  },
  data() {
    return {
      instance: null,
      network: null,
      release: null,
      client: null,
      tab: null,
      showAdvanced: false,
      showAdvancedDisabled: false,
      breadcrumbs: [
        {
          text: this.$t('server.instances'),
          disabled: false,
          to: '/'
        }
      ]
    }
  },
  computed: {
    instances() {
      return this.$store.state.instances
    },
    clients() {
      return this.$store.state.packages.clients
    }
  },
  watch: {
    instances(nval, oval) {
      // dont update if on settings tab
      if (nval && this.tab !== 1) {
        this.update()
      }
    }
  },
  created() {
    this.update()
    this.breadcrumbs.push({
      text: this.instance.name || this.instance.id,
      disabled: true,
      to: '/'
    })
  },
  methods: {
    update() {
      const instanceId = this.$route.params.id

      if (instanceId) {
        this.instance = this.instances.find(function(value, index, arr) {
          return value.id === instanceId
        })
        const clientName = this.instance.client.name
        this.client = this.clients.find(function(value, index, arr) {
          return value.name === clientName
        })
        if (!this.release) {
          const version = this.instance.version
          this.release = this.instance.client.releases.find(function(
            value,
            index,
            arr
          ) {
            return value.version === version
          })
        }
        const networkType = this.instance.network.testnet
          ? 'testnet'
          : 'mainnet'
        this.network = this.$store.state.packages.networks[networkType][
          this.instance.network.id
        ]
      }
    },
    formatUptime(str) {
      const split = str.split(' ')
      if (split.length > 4) {
        const slice = split.slice(-3)
        slice[1] = this.$tc('server.day', slice[0])
        return slice[0] + ' ' + slice[1] + ' - ' + slice[2]
      } else {
        return split[3]
      }
    }
  }
}
</script>
