const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)


const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'atfurman@gmail.com',
        subject: 'Welcome to the Task App',
        text: `Welcome to the app, ${name}. Let me know how you like it.`
    })
}

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'atfurman@gmail.com',
        subject: 'Leaving so soon?',
        text: `${name}, we are sorry to see you go. If you can, please take the time to tell us what we could have done better.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}