const { createMachine, interpret, send, assign } = require('xstate')
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
                        NEXT: {
                            target: 'entry',
                            actions: [
                                (_, event) => {
                                    assign({
                                        direction: (context, _) => {
                                            context.direction = event.payload
                                        }
                                    })
                                }
                            ]
                        }
                    },
                    meta: {
                        message: 'Enter Direction.'
                    }
                },
                entry: {
                    on: {
                        NEXT: {
                            target: 'exit',
                            actions: [
                                (_, event) => {
                                    assign({
                                        entry: (context, _) => {
                                            context.entry = event.payload
                                        }
                                    })
                                }
                            ]
                        }
                    },
                    meta: {
                        message: 'Enter Entry Price.'
                    }
                },
                exit: {
                    on: {
                        NEXT: {
                            target: 'summary',
                            actions: [
                                (_, event) => {
                                    assign({
                                        exit: (context, _) => {
                                            context.exit = event.payload
                                        }
                                    })
                                }
                            ]
                        }
                    },
                    meta: {
                        message: 'Enter Stop Loss.'
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
                        if (state.value === 'summary') {
                            this.bot.sendMessage(this.chatId, `Direction: ${state.context.direction}\nEntry: ${state.context.entry}\nExit: ${state.context.exit}`)
                        }
                        else {
                            this.bot.sendMessage(this.chatId, this.mergeMeta(state.meta).message)
                        }
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