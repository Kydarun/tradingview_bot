const { createMachine, interpret, send } = require('xstate')
const TelegramBot = require('node-telegram-bot-api')

class RiskBot {
    constructor(botId, chatId) {
        this.botId = botId
        this.chatId = chatId
        this.initStates()
        this.initBot()
    }

    mergeMeta(meta) {
        return Object.keys(meta).reduce((acc, key) => {
          const value = meta[key]
      
          // Assuming each meta value is an object
          Object.assign(acc, value)
      
          return acc
        }, {})
    }

    initStates() {
        this.stateMachine = interpret(createMachine({
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
                        NEXT: 'direction'
                    },
                    meta: {
                        message: 'Quickly calculate entry size by entry & SL.'
                    }
                },
                direction: {
                    on: {
                        NEXT: 'entry'
                    },
                    meta: {
                        message: 'Enter Entry Price.'
                    }
                },
                entry: {
                    on: {
                        NEXT: 'exit'
                    },
                    meta: {
                        message: 'Enter Stop Loss.'
                    }
                },
                exit: {
                    on: {
                        NEXT: 'summary'
                    }
                },
                summary: {
                    type: 'final'
                }
            }
        }))
    }

    initBot() {
        this.bot = new TelegramBot(this.botId, { polling: true })
        this.bot.on('message', message => {
            if (message.chat.id === this.chatId) {
                if (message.text === '/risk') {
                    this.stateMachine.onTransition(state => {
                        this.bot.sendMessage(this.chatId, mergeMeta(state.meta).message)
                    }).start()
                    this.stateMachine.send('NEXT')
                }
                else {
                    if (!this.stateMachine.getSnapshot().matches('summary')) {
                        this.stateMachine.send('NEXT')
                    }
                }
            }
        })
    }
}

module.exports = {
    RiskBot
}