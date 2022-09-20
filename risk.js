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
                        DIRECTION: { 
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
                        ENTRY: { 
                            target: 'entry'
                        }
                    },
                    meta: {
                        message: 'Enter Entry Price.'
                    }
                },
                entry: {
                    on: {
                        EXIT: { 
                            target: 'exit'
                        }
                    },
                    meta: {
                        message: 'Enter Stop Loss.'
                    }
                },
                exit: {
                    on: {
                        SUMMARY: { 
                            target: 'summary'
                        }
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
        this.stateMachine.start()
        this.bot.on('message', message => {
            if (message.chat.id === this.chatId) {
                if (message.text === '/risk') {
                    this.stateMachine.start()
                    this.bot.sendMessage(this.chatId, mergeMeta(this.stateMachine.getSnapshot().meta).message)
                    this.stateMachine.send('DIRECTION')
                    this.bot.sendMessage(this.chatId, mergeMeta(this.stateMachine.getSnapshot().meta).message)
                }
                else {
                    const snapshot = this.stateMachine.getSnapshot()
                    if (snapshot.matches('ENTRY')) {
                        this.stateMachine.send('EXIT')
                        this.bot.sendMessage(this.chatId, mergeMeta(this.stateMachine.getSnapshot().meta).message)
                    }
                    else if (snapshot.matches('EXIT')) {
                        this.stateMachine.send('SUMMARY')
                        this.bot.sendMessage(this.chatId, mergeMeta(this.stateMachine.getSnapshot().meta).message)
                    }
                }
            }
        })
    }
}

module.exports = {
    RiskBot
}