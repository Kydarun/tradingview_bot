const axios = require('axios').default
const TelegramBot = require('node-telegram-bot-api')
const { createMachine } = require('xstate')
const { DateTime } = require("luxon")
const express = require('express')

var app = express()

app.post('/', (request, response) => {
  const botToken = '5067222237:AAEqGd3C3MbsLN51G218zVTqJOeBFwYLI2s'
  const chatId = '1306821852'

  const bot = new TelegramBot(botToken, { polling: true })

  let body = ''
  request.on('data', chunk => {
    body = `${body}${chunk}`
  })
  request.on('end', () => {
    if (body) {
      bot.sendMessage(chatId, body).then((res) => {
        console.log(res)
        response.write('Y')
        response.end()
      })
    }
  })
})

app.get('/', (request, response) => {
  response.write(`Hello! It's ${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}.`)
  response.end()
})

app.listen()

// Telegram Conversation Bot
const cryptoBotId = '5144119831:AAEe6D72cqvcNxdf4JEH_Ksj5vjW7Dkd520'
const cryptoChatId = '1306821852'
const stateMachine = createMachine({
  id: 'chat_stage',
  initial: 'ready',
  predictableActionArguments: true,
  states: {
    ready: {},
    direction: {},
    entry: {},
    exit: {},
    summary: {}
  }
})

const chatBot = new TelegramBot(cryptoBotId, { polling: true })

chatBot.on('message', message => {
  if (message.chat_id === cryptoChatId) {
    console.log(message.text)
  }
})