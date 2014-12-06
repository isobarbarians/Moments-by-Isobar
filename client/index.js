if (Meteor.isClient) {
    // counter starts at 0
    Session.setDefault("counter", 0);
    Session.setDefault('cadence', 0);

    Template.dynamicTemplate.helpers({
        whichOne: function() {
            console.log(window.location.pathname);
            if (window.location.pathname == '/ambient') {
                return Template.ambientPage;
            } else if (window.location.pathname == '/dashboard') {
                return Template.dashboard;
            } else if (window.location.pathname == '/flush') {
                Ambient.remove();
                return Template.voice;
            } else {
                return Template.voice;
            }
            // note that we return a Template object, not a string
        }
    });

    Template.voice.helpers({
        cadence: function() {
            return Session.get('cadence');
        }
    });


    Template.ambientPage.helpers({
        ambientType: function() {
            if (Ambient.findOne({
                    'mood': 'current'
                })) {
                return Ambient.findOne({}).color;
            };
        }
    });


    $(document).ready(function() {
        var final_transcript = '';
        var recognizing = false;
        var ignore_onend;
        var start = $('#start_button');
        var startTime;
        var cadence;
        var count = 0;
        var longestLength = 0;
        //var interimTime;


        if (!('webkitSpeechRecognition' in window) && start) {
            console.log('No speech recognition');
        } else {
            var recognition = new webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onstart = function() {
                startTime = new Date().getTime();
                recognizing = true;
                showInfo('info_speak_now');
                interim_span.innerHTML = 'Listening...';
                start.addClass('active');
            };

            recognition.onerror = function(event) {
                if (event.error == 'no-speech') {
                    start.removeClass('active');
                    showInfo('info_no_speech');
                    ignore_onend = true;
                }
                if (event.error == 'audio-capture') {
                    start.removeClass('active');
                    showInfo('info_no_microphone');
                    ignore_onend = true;
                }
            };

            recognition.onend = function() {
                recognizing = false;
                start.removeClass('active');
                if (ignore_onend) {
                    return;
                }
                start.removeClass('active');
                if (!final_transcript) {
                    console.log('Done!');
                    return;
                }
            };

            recognition.onresult = function(event) {
                var interim_transcript = '';

                for (var i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final_transcript += event.results[i][0].transcript;
                    } else {
                        interim_transcript += event.results[i][0].transcript;
                    }
                }
                final_transcript = capitalize(final_transcript);
                final_span.innerHTML = linebreak(final_transcript);
                interim_span.innerHTML = linebreak(interim_transcript);

                if (interim_transcript.indexOf('love') > -1) {
                    Meteor.call('updateData', '#f9859c');
                } else if (interim_transcript.indexOf('shirt') > -1) {
                    Meteor.call('updateData', '#aacbbf');
                }


                longestLength = interim_transcript.split(' ').length;
                var endTime = new Date().getTime();
                
                if ((endTime - startTime) >= 5000) {

                    cadence = (longestLength - count) * 12;
                    count = longestLength;

                    Session.set('cadence', cadence);
                    startTime = new Date().getTime();

                }
            };
        }

        var two_line = /\n\n/g;
        var one_line = /\n/g;

        function linebreak(s) {
            return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
        }

        var first_char = /\S/;

        function capitalize(s) {
            return s.replace(first_char, function(m) {
                return m.toUpperCase();
            });
        }

        start.on('click', function(e) {
            startButton(e);
        });

        function startButton(event) {
            if (recognizing) {
                recognition.stop();
                return;
            }
            final_transcript = '';
            recognition.start();
            ignore_onend = false;
            final_span.innerHTML = '';
            interim_span.innerHTML = '';
            start.removeClass('active');
            showInfo('info_allow');
        }

        function showInfo(s) {
            console.log(s);
        }

    });

}