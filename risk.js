const { createMachine, interpret, send } = require('xstate')
const TelegramBot = require('node-telegram-bot-api')

class RiskBot {
    constructor(botId, chatId) {
        this.botId = botId
        this.chatId = chatId
        this.initStates()
        this.initBot()
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
                        NEXT: { 
                            target: 'direction',
                            actions: send((context, event) => {
                                
                            })
                        }
                    }
                },
                direction: {
                    on: {
                        NEXT: { 
                            target: 'entry',
                            actions: send((context, event) => {

                            })
                        }
                    }
                },
                entry: {
                    on: {
                        NEXT: { 
                            target: 'exit',
                            actions: send((context, event) => {
                                
                            })
                        }
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
    }

    initBot() {
        this.bot = new TelegramBot(this.botId, { polling: true })
        this.stateMachine.start()
        this.bot.on('message', message => {
            if (message.chat.id === this.chatId) {
                if (message.text === '/risk') {
                    this.stateMachine.start()
                    this.stateMachine.send('NEXT')
                    this.bot.sendMessage(this.chatId, this.stateMachine.getSnapshot().value.toString())
                }
                else {
                    if (!this.stateMachine.getSnapshot().matches('summary')) {
                        this.stateMachine.send({ type: 'NEXT', payload: message.text })
                        this.bot.sendMessage(this.chatId, this.stateMachine.getSnapshot().value.toString())
                    }
                }
            }
        })
    }
}

module.exports = {
    RiskBot
}