/* eslint-disable import/no-extraneous-dependencies */
import 'babel-polyfill'
import lzString from 'lz-string'
import { observer } from 'binary-common-utils/lib/observer'
import { getToken } from 'binary-common-utils/lib/storageManager'
import underscore from 'underscore'
import Backbone from 'backbone'
import $ from 'jquery'
import { bot } from './bot'
import View from './view'
import { setAppId } from '../common/appId'
import { notifyError } from './view/logger'
import expect from '../common/expect'
import math from '../common/math'

window._ = underscore
window.Backbone = Backbone
window.$ = $

require('tourist/tourist')
require('notifyjs-browser')
require('./view/draggable')

setAppId()
$.ajaxSetup({
  cache: false,
})

window._trackJs = { // eslint-disable-line no-underscore-dangle
  token: '346262e7ffef497d85874322fff3bbf8',
  application: 'binary-bot',
  enabled: window.location.hostname !== 'localhost',
  console: {
    display: false,
  },
}

require('trackjs')

class BotPage {
  constructor() {
    window.Bot = {
      expect,
      math,
      addBlockByMagic: (blockType) => {
        const dp = Blockly.mainWorkspace.newBlock(blockType)
        dp.initSvg()
        dp.render()
      },
      start: bot.start.bind(bot),
      stop: bot.stop.bind(bot),
      showCode: () => {
        console.log(this.view.blockly.generatedJs); // eslint-disable-line no-console
        console.log(this.view.blockly.blocksXmlStr); // eslint-disable-line no-console
      },
      log: (message, type) => {
        observer.emit(`ui.log.${type}.left`, message)
      },
      getTotalRuns: () => bot.totalRuns,
      getTotalProfit: () => bot.totalProfit,
      getBalance: (balanceType) => (balanceType === 'STR' ? bot.balanceStr : bot.balance),
      notifyError,
      loadHeader: (xml) => this.view.blockly.load(xml, null, true),
    }

    bot.initPromise.then(() => {
      this.view = new View()
      trackJs.configure({
        onError: (payload, error) => {
          if (error && error.message && error.message.indexOf('The play() request was'
            + ' interrupted by a call to pause()') >= 0) {
            return false
          }
          payload.console.push({
            message: lzString.compressToBase64(this.view.blockly.generatedJs),
            severity: 'log',
            timestamp: new Date().toISOString(),
          })
          payload.console.push({
            message: lzString.compressToBase64(this.view.blockly.blocksXmlStr),
            severity: 'log',
            timestamp: new Date().toISOString(),
          })
          payload.console.push({
            message: lzString.compressToBase64(
              Blockly.Xml.domToPrettyText(Blockly.Xml.workspaceToDom(Blockly.mainWorkspace))),
            severity: 'log',
            timestamp: new Date().toISOString(),
          })
          return true
        },
      })
      this.view.initPromise.then(() => {
        trackJs.configure({
          userId: getToken($('#accountSelect').val()).account_name,
        })
        $('.spinning').hide()
        this.view.activeTour = this.view.tours.welcome
        this.view.activeTour.welcome(() => {
          this.view.activeTour = null
        })
      })
    })
  }
}

export default new BotPage()
