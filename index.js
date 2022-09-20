const axios = require('axios').default
const TelegramBot = require('node-telegram-bot-api')
const { createMachine, interpret, send } = require('xstate')
const { DateTime } = require("luxon")
const express = require('express')
const { RiskBot } = require('./risk')

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
const cryptoChatId = 1306821852
//const bot = new RiskBot(cryptoBotId, cryptoChatId)

const stateMachine = interpret(createMachine({
    id: 'risk',
    initial: 'ready',
    predictableActionArguments: true,
    context: {
        direction: '',
        entry: '',
        exit: ''
    },
    states: {
        ready: {
            on: {
                NEXT: { 
                    target: 'direction',
                    actions: send((context, event) => {
                        
                    })
                }
            },
            meta: {
                message: 'Quickly calculate entry size by entry & SL.'
            }
        },
        direction: {
            on: {
                NEXT: { 
                    target: 'entry'
                }
            },
            meta: {
                message: 'Enter Entry Price.'
            }
        },
        entry: {
            on: {
                NEXT: { 
                    target: 'exit'
                }
            },
            meta: {
                message: 'Enter Stop Loss.'
            }
        },
        exit: {
            on: {
                NEXT: { 
                    target: 'summary'
                }
            }
        },
        summary: {
            type: 'final'
        }
    }
}))

function mergeMeta(meta) {
    return Object.keys(meta).reduce((acc, key) => {
      const value = meta[key]
  
      // Assuming each meta value is an object
      Object.assign(acc, value)
  
      return acc
    }, {})
}

stateMachine.start()
console.log(mergeMeta(stateMachine.getSnapshot().meta).message)
stateMachine.send('NEXT')
console.log(mergeMeta(stateMachine.getSnapshot().meta).message)