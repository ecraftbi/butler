/* eslint-disable no-unused-vars */


// Load global variables and functions
var globals = require('../globals');


// --------------------------------------------------------
// Set up UDP server handlers for acting on Sense failed task events
// --------------------------------------------------------
module.exports.udpInitTaskErrorServer = function () {

    // Handler for UDP server startup event
    globals.udpServerTaskFailureSocket.on('listening', function(message, remote) {
        var address = globals.udpServerTaskFailureSocket.address();

        var oldLogLevel = globals.logger.transports.console.level;
        globals.logger.transports.console.level = 'info';

        globals.logger.log('info', 'UDP server listening on %s:%s', address.address, address.port);
        globals.logger.transports.console.level = oldLogLevel;
        
        // Publish MQTT message that UDP server has started
        globals.mqttClient.publish(globals.config.get('Butler.mqttConfig.taskFailureServerStatusTopic'), 'start');
    });

    // Handler for UDP error event
    globals.udpServerTaskFailureSocket.on('error', function(message, remote) {
        var address = globals.udpServerTaskFailureSocket.address();
        globals.logger.log('error', 'UDP server error on %s:%s', address.address, address.port);

        // Publish MQTT message that UDP server has reported an error
        globals.mqttClient.publish(globals.config.get('Butler.mqttConfig.taskFailureServerStatusTopic'), 'error');
    });

    // Main handler for UDP messages relating to failed tasks
    globals.udpServerTaskFailureSocket.on('message', function(message, remote) {
        var msg = message.toString().split(';');

        if (msg[3].substring(0,27) == 'Message from ReloadProvider') {
            // Message arrives as %hostname;%property{TaskName};%property{AppName};%message;%level
            globals.logger.log('warn', '%s - %s: Task "%s" failed, associated with app "%s".', msg[0], msg[4], msg[1], msg[2], msg[3]);

            // Post to Slack when a task has failed
            globals.slack.send({
                text: 'Failed task: "' + msg[1] + '", linked to app "' + msg[2] + '".',
                channel: globals.config.get('Butler.slackConfig.taskFailureChannel'),
                username: msg[0],
                icon_emoji: ':ghost:'
            });

            // Publish MQTT message when a task has failed
            globals.mqttClient.publish(globals.config.get('Butler.mqttConfig.taskFailureTopic'), msg[1]);
        }
    });

};


// --------------------------------------------------------
// Set up UDP server for acting on Sense session and connection events
// --------------------------------------------------------
module.exports.udpInitSessionConnectionServer = function () {

    // Handler for UDP server startup event
    //  globals.udpServerSessionConnectionSocket.on('listening', () => {
    globals.udpServerSessionConnectionSocket.on('listening', function(message, remote) {
        var address = globals.udpServerSessionConnectionSocket.address();

        var oldLogLevel = globals.logger.transports.console.level;
        globals.logger.transports.console.level = 'info';

        globals.logger.log('info', 'UDP server listening on %s:%s', address.address, address.port);
        globals.logger.transports.console.level = oldLogLevel;


        // Publish MQTT message that UDP server has started
        globals.mqttClient.publish(globals.config.get('Butler.mqttConfig.sessionServerStatusTopic'), 'start');
    });

    // Handler for UDP error event
    //  globals.udpServerSessionConnectionSocket.on('error', () => {
    globals.udpServerSessionConnectionSocket.on('error', function(message, remote) {
        var address = globals.udpServerSessionConnectionSocket.address();
        globals.logger.log('error', 'UDP server error on %s:%s', address.address, address.port);

        // Publish MQTT message that UDP server has reported an error
        globals.mqttClient.publish(globals.config.get('Butler.mqttConfig.sessionServerStatusTopic'), 'error');
    });

    // Main handler for UDP messages relating to session and connection events
    globals.udpServerSessionConnectionSocket.on('message', function(message, remote) {
        var msg = message.toString().split(';');
        globals.logger.log('info', '%s: %s for user %s/%s', msg[0], msg[1], msg[2], msg[3]);

        // Send Slack message when session starts/stops, or a connection open/close
        globals.slack.send({
            text: msg[1] + ' for user ' + msg[2] + '/' + msg[3],
            channel: globals.config.get('Butler.slackConfig.loginNotificationChannel'),
            username: msg[0],
            icon_emoji: ''
        });

        // Handle session events
        if (msg[1] == 'Start session') {
            globals.mqttClient.publish(globals.config.get('Butler.mqttConfig.sessionStartTopic'), msg[0] + ': ' + msg[2] + '/' + msg[3]);
        }

        if (msg[1] == 'Stop session') {
            globals.mqttClient.publish(globals.config.get('Butler.mqttConfig.sessionStopTopic'), msg[0] + ': ' + msg[2] + '/' + msg[3]);
        }

        // Handle connection events
        if (msg[1] == 'Open connection') {
            globals.mqttClient.publish(globals.config.get('Butler.mqttConfig.connectionOpenTopic'), msg[0] + ': ' + msg[2] + '/' + msg[3]);
        }

        if (msg[1] == 'Close connection') {
            globals.mqttClient.publish(globals.config.get('Butler.mqttConfig.connectionCloseTopic'), msg[0] + ': ' + msg[2] + '/' + msg[3]);
        }

    });

};
