const { createMachine, interpret, assign } = require('xstate')
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
                                assign({
                                    direction: (_, event) => event.payload.input
                                })
                            ]
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
                            this.bot.sendMessage(this.chatId, this.getSummary(state.context), { parse_mode: 'HTML' })
                        }
                        else {
                            const meta = this.mergeMeta(state.meta)
                            this.bot.sendMessage(this.chatId, meta.message, {
                                'reply_markup': meta.reply_markup
                            })
                        }
                    }).start()
                    this.stateMachine.send('NEXT')
                }
                else {
                    if (!this.stateMachine.getSnapshot().matches('summary')) {
                        this.stateMachine.send({type: 'NEXT', payload: { input: message.text }})
                    }
                }
            }
        })
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
        if (context.direction !== 'LONG' && context.direction !== 'SHORT') return 'Unable to identify direction. Please type /risk to restart.'
        
        var summary = `<b>Entry Size Summary</b>\n\nDirection: ${context.direction}\nEntry: ${context.entry}\nStop Loss: ${context.exit}\n\n`
        
        const entrySize = this.getEntrySize(context)
        for (i in [1,2,3,4,5,10]) {
            summary = `${summary}\nRisk USDT${i} = USDT${(i * entrySize).toFixed(2)}`
        }

        return summary
    }
}

module.exports = {
    RiskBot
}