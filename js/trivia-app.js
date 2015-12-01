var Trivia = Trivia || {};

Trivia.App = Backbone.View.extend({

	application: 'client',

	el : $('#trivia-app'),

	clickEvent: !!('ontouchend' in window) ? 'touchend' : 'click',

	initialize: function(config) { 

		this.context = window.webkitAudioContext ? new webkitAudioContext() : false;
		
		this.socket = socket = io.connect('ws://' + window.location.host);
		this.model = new Trivia.QuestionModel({
			socket: this.socket, 
			team: config.team
		});

		this.questionTemplate = Handlebars.compile($('#trivia-question-template').html());
		this.answerTemplate = Handlebars.compile($('#trivia-answer-template').html());

		//event listeners
		this.attachListeners();

		//register the team with the server
		this.register(config.team);

		//load audio files
		this.loadAudioFile('sounds/Buzzer2.mp3','failSound');
		this.loadAudioFile('sounds/Cheering.mp3','successSound');
		this.loadAudioFile('sounds/blip_click.wav','selectionSound');

		this.setDefaultContent();

	},

	attachListeners: function () {

		//subscribe to socket events
		this.socket.on('results', $.proxy(this.renderResult, this));
		this.socket.on('gameOver', $.proxy(this.gameOver, this));

		//subscribe to model changes
		this.model.on('change:question', this.hideResult, this);
		this.model.on('change:question', this.render, this);

	},

	setDefaultContent: function () {

		var questionText = this.questionTemplate({text:'Get Ready!'});
		this.$el.html(questionText)

	},

	render: function (data) {
		console.log('render')
		var question = this.model.get('question');
		var answers = question.answers;
		var answerText;

		var questionText = this.questionTemplate(question);
		this.$el.html(questionText)

		var previousAnswer = this.model.get('answers')[question.id];

		for (var i = 0; i < answers.length; i++) {
			
			answerText = $(this.answerTemplate(answers[i]));

			answerText.on(this.clickEvent, $.proxy(this.selectAnswer, this, {question: question.id, answer: i}))

			if(i === previousAnswer){ answerText.addClass('selected'); }

			this.$el.append(answerText)

			setTimeout($.proxy(function(){
					this.removeClass('loading')
			},answerText) , 100 + (100*i))

		}

	},

	gameOver: function () {
		this.$el.html('');
		$('#trivia-result').removeClass('correct').removeClass('incorrect').addClass('gameOver');
		this.showResult();
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
			$('#trivia-result').removeClass('correct').addClass('incorrect');
			this.playSound(this.failSound);
		} else {
			$('#trivia-result').removeClass('incorrect').addClass('correct');
			this.playSound(this.successSound);
		}

	  this.showResult();

	},

	selectAnswer : function (data, event) {

		var targ = $(event.target);

		targ.siblings('.selected').removeClass('selected');
		targ.addClass('selected');

		this.playSound(this.selectionSound);

		this.model.setAnswer(data.question,data.answer)

	},

	register: function (team){

		socket = this.socket;
		socket.emit(this.application, { action: 'register', team: team });

	},
	
	playSound: function (buffer, gain) {

		if(buffer && this.context){
			context = this.context;


		    var source = context.createBufferSource();
		        source.buffer = buffer;
		        source.connect(context.destination);
		        source.start(0); // Play sound immediately
		        console.log('sound played i think')
		} else {
			console.log('no sound buffer')
		}

	},


	loadAudioFile: function (url, bufferStr) {

		if(!this.context){
			console.log('no context');
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
					console.log('incomingBuffer ' + bufferStr, incomingBuffer)
					that[bufferStr] = incomingBuffer; // Not declared yet
				},
				function(){
					console.log(arguments)
				}
			)
		};

		request.send();
		
	}

});
