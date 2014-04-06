Questions = new Meteor.Collection('questions');
QuestionsAnswered = new Meteor.Collection('questions_answered');

if (Meteor.isClient) {
    Meteor.subscribe('next_question');

    var QUESTION_STATES = ['PENDING', 'RIGHT', 'WRONG'];

    var current_question;
    var new_question;

    Meteor.autorun(function() {
        new_question = Questions.findOne();
        if (new_question) {
            _.extend(new_question, {
                state: 'PENDING'
            });
        } else if (!current_question) {
            return;
        }

        if (current_question) {
            Meteor.setTimeout(function() {
                current_question = new_question;
                Session.set('answer_check', null);
                Session.set('new_question', Random.id());
            }, 3000);
        } else {
            current_question = new_question;
            Session.set('answer_check', null);
            Session.set('new_question', Random.id());
        }
    });

    UI.body.helpers({
        current_question: function() {
            Session.get('new_question');
            return current_question;
        }
    });

    Template.choice.helpers({
        choice: function() {
            return this.question.choices[this.index];
        },
        answer_state: function() {
            var answer = Session.get('answer_check');
            if (this.question.choices[this.index] === answer) {
                switch (current_question.state) {
                    case 'PENDING':
                        return '';
                    case 'RIGHT':
                        return 'answer-right';
                    case 'WRONG':
                        return 'answer-wrong';
                }
            } else {
                return '';
            }
        }
    });

    Template.choice.events({
        'click .choice': function() {
            if (current_question.state === 'PENDING') {
                var answer = this.question.choices[this.index];

                Meteor.call('answerQuestion', this.question._id, answer, function(err, result) {
                    if (result) {
                        current_question.state = 'RIGHT';
                    } else {
                        current_question.state = 'WRONG';
                    }
                    Session.set('answer_check', answer);
                });
            }
        }
    });
}

if (Meteor.isServer) {
    Meteor.methods({
        answerQuestion: function(question_id, answer) {
            var right_answer = Questions.findOne(question_id).answer;
            var isRight = right_answer === answer;
            Questions.update(question_id, {
                '$set': {
                    answered: isRight
                }
            });
            return isRight;
        }
    });

    Meteor.publish('next_question', function() {
        return Questions.find({
            answered: {
                '$exists': false
            }
        });
    });

    Meteor.startup(function() {
        Questions.remove({});

        Questions.insert({
            question: 'What is no programming Language?',
            category: 'tec',
            choices: ['Ceylon', 'Kotlin', 'HyperV', 'Scala'],
            answer: 'HyperV' //do not send to client ;-)
        });

        Questions.insert({
            question: 'What kind of Language is Java?',
            category: 'tec',
            choices: ['dynamically typed', 'statically typed', 'fluent typed', 'not typed'],
            answer: 'statically typed' //do not send to client ;-)
        });

        Questions.insert({
            question: 'How old is Eric Northman in True Blood?',
            category: 'tv',
            choices: ['1000', '3000', '260', '500'],
            answer: '1000' //do not send to client ;-)
        });
    });
}
