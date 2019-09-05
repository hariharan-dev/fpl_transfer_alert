'use strict';
const constants = require('./constants/prod');
const nodemailer = require('nodemailer');

// async..await is not allowed in global scope, must use a wrapper
async function email(subject,text) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    // let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    // let transporter = nodemailer.createTransport({
    //     host: 'smtp.ethereal.email',
    //     port: 587,
    //     secure: false, // true for 465, false for other ports
    //     auth: {
    //         user: testAccount.user, // generated ethereal user
    //         pass: testAccount.pass // generated ethereal password
    //     }
    // });

    console.log('Creating transporter');
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: constants.username, // generated ethereal user
            pass: constants.password // generated ethereal password
        }
    });

    let isValid = await transporter.verify();
    console.log('Transporter verified:' + isValid);

    console.log('Sending Mail');

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Fpl Transfer Alert 👻" <findhariharand@gmail.com>', // sender address
        to: 'hariharand96@gmail.com', // list of receivers
        subject: subject, // Subject line
        text: text, // plain text body
        // html: '<b>Hello world?</b>' // html body
    });

    console.log('Message sent: %s', info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

function getPlayerFormat(isUnsafePlayer, player) {
    if(isUnsafePlayer) {
       return `${player[1]}(${player[3]}) - ${player[2]}, ${player[7]}, ${player[12]}, Opps: ${
            player[16]
          }\n Buffer: ${player[10]} \n\n`;
    }
    return `${player[1]}(${player[3]}) - ${player[2]}, ${player[7]}, ${player[12]}, Opps: ${
        player[16]
      }\n\n`;
}

function addTopPlayers(top8Buys) {
    let message = 'Top 8 Buys\n';
    message += '----------------------------------------------------\n\n';
    top8Buys.forEach(player => message += getPlayerFormat(false, player));
    message += '----------------------------------------------------\n\n';
    return message;
}

function addUnsafePlayers(unsafePlayers) {
    let message = '----------------------------------------------------\n';
    message += 'PLAYERS TO BE SOLD\n';
    message += '----------------------------------------------------\n\n';
    if(unsafePlayers.length) {
        unsafePlayers.forEach(player => message += getPlayerFormat(true, player));
    } else {
        message += 'No Player at risk \n\n';
    }
    message += '----------------------------------------------------\n';
    return message;
}

/**
 *  [
            "",(0)(unknown)
            "Mustafi",(1)(name)
            "Arsenal",(2)(team)
            "D",(3)(position)
            "A",(4)(status)
            "0.5",(5)(owned)
            "5.4",(6)
            "£5.4m",(7)(price)
            "0",(8)()
            "---",(9)
            "2525",(10)
            "-33.3",(11)
            "-33.3",(12)(target)
            "-2",(13)
            "-2",(14)
            "Mustafi",(15)
            "Spurs(H) Watford(A) Aston Villa(H) Man Utd(A) "(16)(opp teams)
    ]
 * @param {*} unsafePlayers
 */

function sendMail(unsafePlayers, top8Buys) {
    let subject = '☺ All players are safe ☺ ';
    let msg = '';
    if(unsafePlayers.length) {
        subject = '⚠ TRANSFER ACTION NEEDED ⚠';
    }
    msg += addUnsafePlayers(unsafePlayers);
    msg += addTopPlayers(top8Buys);
    console.log(msg);
    console.log('Calling Mail Fn');
    email(subject, msg);
}

function sendErrorMail(errorTrace) {
    let subject = '❌ FPL TRANSFER LOOKUP FAILED ❌';
    let msg = '';
    msg += errorTrace
    console.log(msg);
    console.log('Sending Error Mail');
    email(subject, msg);
}


module.exports = { sendMail, sendErrorMail };