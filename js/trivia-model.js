var Trivia = Trivia || {};


Trivia.QuestionModel = Backbone.Model.extend({

	defaults: {
		socket: false,
		answers: [],
		question: false,
		team: null
	},

	initialize: function (config) {
		this.get('socket').on('question', $.proxy(this.updateQuestion, this))
	},

	setAnswer: function (question, answer) {

		var answers = this.get('answers')
			answers[question] = answer;

		this.set('answers', answers);

		//send the server the answer
		socket.emit('client', { 
			action: 'answer', 
			r: this.get('team'),
			question: question,
			answer: answer
		});

	},

	updateQuestion : function (data){
		console.log('updateQuestion')
		this.set('question', data);
	}

});