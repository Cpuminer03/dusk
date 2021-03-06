<template>
  <div>
    <v-col :cols="12" class="pa-0">
      <v-row no-gutters class="pb-2">
        <v-col :cols="6" class="pr-1">
          <v-card v-if="network">
            <v-list-item three-line>
              <v-list-item-content>
                <div class="overline mb-4">
                  {{ $t('geth.dashboard.network') }}
                </div>
                <v-list-item-title class="headline mb-1">
                  {{ network.name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  <v-avatar tile size="16">
                    <img
                      :src="
                        require('~/packages' +
                          network.duskpkg.path +
                          network.icon)
                      "
                    />
                  </v-avatar>
                  {{
                    network.testnet
                      ? $t('geth.dashboard.testnet')
                      : $t('geth.dashboard.mainnet')
                  }}
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-avatar tile size="80">
                <v-icon x-large>mdi-earth</v-icon>
              </v-list-item-avatar>
            </v-list-item>
          </v-card>
        </v-col>
        <v-col v-if="peers && peers.length > 0" :cols="6" class="pl-1">
          <v-card>
            <v-list-item three-line>
              <v-list-item-content>
                <div class="overline mb-4">
                  {{ $t('geth.dashboard.connections') }}
                </div>
                <v-list-item-title class="headline mb-1">
                  {{ $tc('geth.dashboard.peers', peers.length - 1) }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ $tc('geth.dashboard.countries', countryCount) }}
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-avatar tile size="80">
                <v-icon x-large>mdi-account-group</v-icon>
              </v-list-item-avatar>
            </v-list-item>
          </v-card>
        </v-col>
        <v-col v-else :cols="6" class="pl-1">
          <v-skeleton-loader type="image" style="height:120px" />
        </v-col>
      </v-row>
    </v-col>
    <v-card
      v-if="peers && peers.length > 0"
      class="mb-2 bg-transparent"
      outlined
    >
      <v-row no-gutters>
        <v-col :cols="6" class="pa-3">
          <v-card class="bg-transparent" flat style="height:280px;">
            <client-only placeholder="Loading...">
              <world-map
                v-if="map"
                :country-data="map"
                low-color="#6fceb7"
                high-color="#6fceb7"
                default-country-fill-color="#333"
                country-stroke-color="#6fceb7"
              />
            </client-only>
          </v-card>
        </v-col>
        <v-col :cols="6" class="pr-3 pl-3">
          <countries v-if="chartCountry" :data="chartCountry" />
        </v-col>
      </v-row>
    </v-card>
    <v-row v-else no-gutters class="mb-2">
      <v-col :cols="6" class="pa-0 pr-1">
        <v-skeleton-loader type="image, image" style="height:310px;" />
      </v-col>
      <v-col :cols="6" class="pa-0 pl-1">
        <v-skeleton-loader type="image, image" style="height:310px;" />
      </v-col>
    </v-row>
    <v-card
      v-if="peers && peers.length > 0"
      class="mb-2 bg-transparent"
      outlined
    >
      <v-row no-gutters style="height:150px;">
        <v-col :cols="3">
          <doughnut
            v-if="chartOperatingSystem"
            :data="chartOperatingSystem"
            legend="top"
            right
          />
        </v-col>
        <v-col :cols="3">
          <doughnut v-if="chartArch" :data="chartArch" title="Arch" right />
        </v-col>
        <v-col :cols="3">
          <doughnut v-if="chartClient" :data="chartClient" legend="top" right />
        </v-col>
        <v-col :cols="3">
          <doughnut
            v-if="chartVersion"
            :data="chartVersion"
            legend="top"
            right
          />
        </v-col>
      </v-row>
    </v-card>
    <v-row v-else no-gutters class="pb-2">
      <v-col :cols="12">
        <v-skeleton-loader type="image" style="height:150px;" />
      </v-col>
    </v-row>
    <v-card v-if="peers && peers.length > 0" flat>
      <v-row no-gutters>
        <v-col :cols="12">
          <v-data-table
            :headers="headers"
            :items="peers"
            :items-per-page="10"
            :footer-props="footerProps"
            item-key="id"
            flat
            dense
          >
            <template v-slot:body="{ items }">
              <tbody>
                <tr
                  v-for="item in items"
                  :key="item.id"
                  :class="item.id === 0 ? 'custom-highlight-row' : ''"
                >
                  <td class="text-left">{{ item.countryName }}</td>
                  <td class="text-left">{{ item.client }}</td>
                  <td class="text-left">{{ item.version }}</td>
                  <td class="text-left">{{ item.tag }}</td>
                  <td class="text-left">{{ item.build }}</td>
                  <td class="text-left">{{ item.os }}</td>
                  <td class="text-left">{{ item.arch }}</td>
                </tr>
              </tbody>
            </template>
            <template v-slot:item.id="{ item }">
              <v-icon v-if="item.id === 0" small>
                mdi-star
              </v-icon>
            </template>
            <template v-slot:item.os="{ item }">
              <v-icon v-if="item.os === 'linux'" small>
                mdi-linux
              </v-icon>
              <v-icon v-else-if="item.os === 'darwin'" small>
                mdi-apple
              </v-icon>
              <v-icon v-else small>mdi-windows</v-icon>
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </v-card>
    <v-row v-else no-gutters class="pb-2">
      <v-col :cols="12">
        <v-skeleton-loader
          type="table-thead, table-row-divider, table-row-divider, table-row-divider, table-tfoot"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script>
import stringifyObject from 'stringify-object'
import WorldMap from 'vue-world-map'
import Countries from '~/components/charts/Countries.vue'
import Doughnut from '~/components/charts/Doughnut.vue'

export default {
  components: {
    Countries,
    Doughnut,
    WorldMap
  },
  props: {
    provider: {
      type: Object,
      default() {
        return null
      }
    },
    network: {
      type: Object,
      default() {
        return null
      }
    }
  },
  computed: {
    headers() {
      return [
        { text: this.$t('geth.dashboard.country'), value: 'countryName' },
        { text: this.$t('geth.dashboard.client'), value: 'client' },
        { text: this.$t('geth.dashboard.version'), value: 'version' },
        { text: this.$t('geth.dashboard.tag'), value: 'tag' },
        { text: this.$t('geth.dashboard.build'), value: 'build' },
        { text: this.$t('geth.dashboard.os'), value: 'os' },
        { text: this.$t('geth.dashboard.arch'), value: 'arch' }
      ]
    },
    footerProps() {
      return {
        itemsPerPageAllText: this.$t('common.table.all'),
        itemsPerPageText: this.$t('geth.dashboard.peersPerPage'),
        itemsPerPageOptions: [5, 10, 25, -1]
      }
    },
    peers() {
      return this.provider.peers
    },
    chartArch() {
      return this.peers.length > 0
        ? this.toChartData(this.peers, 'arch', 0)
        : false
    },
    countryCount() {
      return this.chartCountry ? this.chartCountry.datasets[0].data.length : 0
    },
    chartCountry() {
      return this.peers.length > 0
        ? this.toChartData(this.peers, 'countryCode', 1)
        : false
    },
    chartClient() {
      return this.peers.length > 0
        ? this.toChartData(this.peers, 'client', 0)
        : false
    },
    chartOperatingSystem() {
      return this.peers.length > 0
        ? this.toChartData(this.peers, 'os', 0)
        : false
    },
    chartVersion() {
      return this.peers.length > 0
        ? this.toChartData(this.peers, 'version', 0)
        : false
    },
    map() {
      return this.peers.length > 0 ? this.toMapData(this.peers) : false
    }
  },
  methods: {
    // type 0 = doughnut, 1 = bar,
    toChartData(peers, key, type) {
      const newArr = this.strip(peers, key)
      const counts = {}
      for (const i in newArr) {
        counts[newArr[i]] = counts[newArr[i]] ? counts[newArr[i]] + 1 : 1
      }
      const cdata = {
        labels: [],
        counts: []
      }
      for (const key in counts) {
        cdata.labels.push(key)
        cdata.counts.push(counts[key])
      }
      return {
        labels: cdata.labels,
        datasets: [
          {
            backgroundColor:
              type === 0 ? ['#6fceb7', '#e76754', '#ff00ff'] : '#6fceb7',
            data: cdata.counts,
            borderWidth: [0, 0, 0]
          }
        ]
      }
    },
    toMapData(arr) {
      const newArr = this.strip(arr, 'countryCode')
      const counts = {}
      for (const i in newArr) {
        counts[newArr[i]] = counts[newArr[i]] ? counts[newArr[i]] + 1 : 1
      }
      return counts
    },
    strip(arr, key) {
      const newArr = []
      for (const i in arr) {
        if (arr[i][key]) {
          newArr.push(arr[i][key])
        }
      }
      return newArr
    },
    prettyJson(obj) {
      return stringifyObject(obj, {
        indent: '  ',
        singleQuotes: false,
        inlineCharacterLimit: 12
      })
    }
  }
}
</script>
