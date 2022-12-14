const { createMachine, interpret, assign } = require('xstate')
const TelegramBot = require('node-telegram-bot-api')

class RiskBot {
    constructor(telegramBot, chatId) {
        this.telegramBot = telegramBot
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
                    entry: [
                        (context, event) => {
                            assign({
                                direction: (_, event) => '',
                                entry: (_, event) => '',
                                exit: (_, event) => ''
                            })
                        }
                    ],
                    on: {
                        NEXT: 'direction',
                        RESTART: {
                            target: 'ready'
                        }
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
                                assign({
                                    direction: (_, event) => event.payload.input
                                })
                            ]
                        },
                        RESTART: {
                            target: 'ready'
                        }
                    },
                    meta: {
                        message: 'Enter Direction.',
                        reply_markup: {
                            keyboard:[['Long'], ['Short']]
                        }
                    }
                },
                entry: {
                    on: {
                        NEXT: {
                            target: 'exit',
                            actions: [
                                assign({
                                    entry: (_, event) => event.payload.input
                                })
                            ]
                        },
                        RESTART: {
                            target: 'ready'
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
                                assign({
                                    exit: (_, event) => event.payload.input
                                })
                            ]
                        },
                        RESTART: {
                            target: 'ready'
                        }
                    },
                    meta: {
                        message: 'Enter Stop Loss.'
                    }
                },
                summary: {
                    on: {
                        RESTART: {
                            target: 'ready'
                        }
                    }
                }
            }
        }))
        this.initialState = this.stateMachine.initialState
    }

    initBot() {
        this.stateMachine.onTransition(state => {
            if (state.value === 'summary') {
                if (this.telegramBot) {
                    this.telegramBot.sendMessage(this.chatId, this.getSummary(state.context), { parse_mode: 'HTML' })
                }
                else {
                    console.log(this.getSummary(state.context))
                }
            }
            else {
                const meta = this.mergeMeta(state.meta)
                if (this.telegramBot) {
                    this.telegramBot.sendMessage(this.chatId, meta.message, {
                        'reply_markup': meta.reply_markup
                    }).then(res => {
                        if (state.value === 'ready') {
                            this.stateMachine.send('NEXT')
                        }
                    })
                }
                else {
                    console.log(meta.message)
                    if (state.value === 'ready') {
                        this.stateMachine.send('NEXT')
                    }
                }
            }
        })
        if (this.telegramBot) {
            this.telegramBot.on('message', message => {
                if (message.chat.id === this.chatId) {
                    this.next(message.text)
                }
            })
        }
    }

    next(text) {
        if (text === '/risk') {
            if (this.stateMachine.getSnapshot().value !== 'ready') {
                this.stateMachine.send('RESTART')
            }
            else {
                this.stateMachine.start()
            }
        }
        else {
            if (!this.stateMachine.getSnapshot().matches('summary')) {
                this.stateMachine.send({type: 'NEXT', payload: { input: text }})
            }
        }
    }

    getEntrySize(context) {
        const direction = context.direction
        const entry = parseFloat(context.entry)
        const sl = parseFloat(context.exit)

        const loss = 1

        const entrySizeInCoin = loss / (direction.toLowerCase() == 'long' ? entry - sl : sl - entry)
        const entrySizeInUsdt = entrySizeInCoin * entry

        return entrySizeInUsdt
    }

    getSummary(context) {
        if (isNaN(context.entry)) return 'Invalid Entry Price. Please type /risk to restart.'
        if (isNaN(context.exit)) return 'Invalid Exit Price. Please type /risk to restart.'
        if (context.direction.toLowerCase() !== 'long' && context.direction.toLowerCase() !== 'short') return 'Unable to identify direction. Please type /risk to restart.'
        
        var summary = `<b>?????? Entry Size Summary ??????</b>\n\nDirection: ${context.direction}\nEntry: ${context.entry}\nStop Loss: ${context.exit}\n`
        
        const entrySize = this.getEntrySize(context)

        const riskSizes = [1,2,3,4,5,10]
        riskSizes.forEach((value, index, array) => {
            summary = `${summary}\nRisk <b>USDT ${value}</b> ?????? <b>USDT ${(value * entrySize).toFixed(2)}</b> Entry Size`
        })
        return summary
    }
}

module.exports = {
    RiskBot
}