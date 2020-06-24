const sgMail = require('@sendgrid/mail')


sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email,name) =>{
    sgMail.send({
        to : email,
        from : 'caiobornatto@gmail.com',
        subject: 'Thanks for joining in',
        text : `Welcome to the app, ${name}. Let me know how you get along with the app`
    })
}

const sendGoodByeEmail = (email,name) =>{
    sgMail.send({
        to : email,
        from : 'caiobornatto@gmail.com',
        subject: 'Sorry to see you go!',
        text : `We hope to see you again, ${name}. Let us know how we can inprove`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendGoodByeEmail
}