var Trivia = Trivia || {};

Trivia.App = Backbone.View.extend({

	application: 'client',

	clickEvent: !!('ontouchstart' in window) ? 'touchstart' : 'click',

	context:  window.webkitAudioContext ? new webkitAudioContext() : false,

	initialize: function(config) { 
		
		this.socket = socket = io.connect('ws://' + window.location.host);
		this.model = new Trivia.QuestionModel({
			socket: this.socket, 
			team: config.team
		});

		this.questionTemplate = Handlebars.compile($('#trivia-question-template').html());
		this.answerTemplate = Handlebars.compile($('#trivia-answer-template').html());

		this.setElement($('#trivia-app'));

		//event listeners
		this.attachListeners();

		//register the team with the server
		this.register(config.team);

		//load audio files
		this.loadAudioFile('sounds/Buzzer2.mp3','failSound');
		this.loadAudioFile('sounds/Cheering.mp3','successSound');
	},

	attachListeners: function () {

		//subscribe to socket events
		this.socket.on('results', $.proxy(this.renderResult, this));

		//subscribe to model changes
		this.model.on('change:question', this.hideResult, this);
		this.model.on('change:question', this.render, this);

	},

	render: function (data) {
		
		var question = this.model.get('question');
		var answers = question.answers;
		var answerText;

		var questionText = this.questionTemplate(question);
		this.$el.html(questionText)

		for (var i = 0; i < answers.length; i++) {
			
			answerText = $(this.answerTemplate(answers[i]));

			answerText.on(this.clickEvent, $.proxy(this.selectAnswer, this, {question: question.id, answer: i}))

			this.$el.append(answerText)

			setTimeout($.proxy(function(){
					this.removeClass('loading')
			},answerText) , 100 + (100*i))

		}

		//$('.loading').removeClass('loading')

	},

	hideResult : function () {

	  $('#trivia-result').addClass('hidden');

	},

	showResult : function () {

	  $('#trivia-result').removeClass('hidden');

	},

	renderResult: function (data) {

		var userAnswer = this.model.get('answers')[data.id];

		if(userAnswer !== data.correctAnswer || userAnswer == undefined){
			$('#trivia-result').html('WRONG!');
			this.playSound(this.failSound);
		} else {
			$('#trivia-result').html('CORRECT!');
			this.playSound(this.successSound);
		}

	  this.showResult();

	},

	selectAnswer : function (data, event) {

		var targ = $(event.target);

		targ.siblings('.selected').removeClass('selected');
		targ.addClass('selected');

		this.model.setAnswer(data.question,data.answer)

	},

	register: function (team){

		socket = this.socket;
		socket.emit(this.application, { action: 'register', team: team });

	},
	
	playSound: function (buffer) {

		if(buffer){
			context = this.context;

		    var source = context.createBufferSource();

		        source.buffer = buffer;
		        source.connect(context.destination);
		        source.noteOn(0); // Play sound immediately
		} else {
			console.log('no sound buffer')
		}

	},

	loadAudioFile: function (url, bufferStr) {

		if(!this.context){
			return;
		}
		
		var that = this;
		var context = this.context;
		var request = new XMLHttpRequest();

		request.open('get', url, true);
		request.responseType = 'arraybuffer';

		request.onload = function () {
			context.decodeAudioData(
				request.response,
				function(incomingBuffer) {
					that[bufferStr] = incomingBuffer; // Not declared yet
				}
			)
		};

		request.send();
		
	}

});
