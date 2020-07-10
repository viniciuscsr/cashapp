const nodemailer = require('nodemailer');

async function requestMoneyEmail(
  requestee_name,
  requestee_email,
  requestor_name,
  amount
) {
  let transporter = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: '95a32120ba1fac',
      pass: 'bb4e04b89a0d33',
    },
  });

  mailOptions = {
    from: '"CashApp Team" <cashapp@cashapp.com>',
    to: `${requestee_email}`,
    subject: `You Received a Money Request from ${requestor_name}`,
    text: `Hi ${requestee_name} , you received a money request of USD ${amount} from ${requestor_name}`,
    html: `<b>Hi ${requestee_name}! </b><br> , you received a money request of ${amount} USD from ${requestor_name}`,
  };

  let info;
  try {
    info = await transporter.sendMail(mailOptions);
  } catch (err) {
    console.log(err);
  }
  console.log('Message sent: %s', info.messageId);
}

module.exports = requestMoneyEmail;
