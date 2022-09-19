const axios = require('axios').default
const { DateTime } = require("luxon")
const express = require('express')

var app = express()

app.get('/', (request, response) => {
  const botToken = '5067222237:AAEqGd3C3MbsLN51G218zVTqJOeBFwYLI2s'
  const chatId = '1306821852'

  let body = ''
  request.on('data', chunk => {
    body = `${body}${chunk}`
  })
  request.on('end', () => {
    if (body) {
        axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: body
      }).then((res) => {
        console.log(res)
        response.write('Y')
        response.end()
      })
    }
    else {
      response.write(`Hello! It's ${DateTime.now().toLocaleString(DateTime.DATETIME_MED)}.`)
      response.end()
    }
  })
})

app.listen()