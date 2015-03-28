require('dotenv').load();
var _ = require('lodash');
var client = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

var sendSMS = function(repo, versionNumber) {
  versionNumber = versionNumber.toString();
  client.sendMessage({

    to: process.env.PHONE_NUMBER, // Any number Twilio can deliver to
    from: process.env.TWILIO_NUMBER, // A number you bought from Twilio and can use for outbound communication
    body: "There is a new version(s) of " +  repo + ", version(s): " + versionNumber

  }, function(err, responseData) {
    if (!err) {
      console.log("Message sent successfully!");
      console.log(responseData.body);
    } else {
    console.error(err);
  }
  });
};

module.exports = sendSMS;
