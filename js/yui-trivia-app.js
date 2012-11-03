YUI.add('trivia-app', function (Y) {
  
  console.log(Y.Base)

  Y.TriviaModel = Y.Base.create('triviaModel', Y.Model, [], {

	initializer : function () {

		var that = this;

		this.get('socket').on('question',function (data) {
			that.set('question', data);
			that.set('answer', null);
		});
	},

	// This tells the Model to use a localStorage sync provider (which we'll
	// create below) to save and load information about a todo item.
	sync: function () {
		console.log('sync')
	},

	// This method will toggle the `done` attribute from `true` to `false`, or
	// vice versa.
	setAnswer: function (question, answer) {

		//set the answer
		var answers = this.get('answers')
			answers[question] = answer;

		this.set('answers',answers);

		//send the server the answer
		socket.emit('client', { 
			action: 'answer', 
			team: this.get('team'),
			question: question,
			answer: answer
		});

		//save the answer
		this.save();

	}
}, {
	ATTRS: {

		socket: { value: '' },

		// Indicates whether or not this todo item has been completed.
		answers: {value: []},

		// Contains the text of the todo item.
		question: { value : ''},

	}
});





  Y.TriviaApp = Y.Base.create('triviaApp', Y.View, [], {

  	clickEvent: !!('ontouchstart' in window) ? 'touchstart' : 'click',

  	context:  window.webkitAudioContext ? new webkitAudioContext() : false,

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
						that.set(bufferStr,incomingBuffer); // Not declared yet
					}
				)
			};

		request.send();
		
	},

	selectAnswer : function (event, data) {

		var model = this.get('model');

		event.currentTarget.ancestor().all('.selected').removeClass('selected');
		event.currentTarget.addClass('selected');

		model.setAnswer(data.question,data.answer)

	},

	initializer : function (config) {

		//unhide view
		Y.one('#trivia-question').removeClass('hidden');

		//set up components
		var that = this;
		var socket = io.connect('ws://' + window.location.host);
		var model = new Y.TriviaModel({socket: socket, team: config.team  });

		//load audio files
		this.loadAudioFile('sounds/Buzzer2.mp3','failSound');
		this.loadAudioFile('sounds/Cheering.mp3','successSound');

		//question change
		model.after('questionChange', this.render, this)
		model.after('questionChange', this.hideResult, this)

		//question result
		socket.on('results', function(data){ that.renderResult.call(that,data)});

		//end of game
		socket.on('gameOver', function(data){ that.renderGameOver.call(that,data)});

		//store components
		this.set('model', model);
		this.set('socket', socket);

		//register the team with the server
		this.registerTeam(config.team);

	},

	renderGameOver: function (data) {


		Y.one('#trivia-result').setHTML('GAME OVER!');
			  this.showResult();

	},

	registerTeam: function (team){

		socket = this.get('socket');
		socket.emit('client', { action: 'register', team: team });

	},

	hideResult : function () {
	  Y.one('#trivia-result').addClass('hidden');
	},

	showResult : function () {
	  console.log('showResult!', this)
	  Y.one('#trivia-result').removeClass('hidden');
	 

	},

	renderResult : function(data) {

	  var model = this.get('model')
	  var userAnswer = model.get('answers')[data.id];

	  if(userAnswer !== data.correctAnswer || userAnswer == undefined){
		Y.one('#trivia-result').setHTML('WRONG!');
		 this.playSound(this.get('failSound'));
	  } else {
		Y.one('#trivia-result').setHTML('CORRECT!');
		 this.playSound(this.get('successSound'));
	  }

	  this.showResult();

	},

	render : function () {

		var containerNode = this.get('container');

		var answerHTML,
			answerSub,
			answerNode;

		var question = this.get('model').get('question');
		var questionTemplate = Y.one('#trivia-question-template').getHTML();
		var questionContainer = Y.one('#trivia-question');
			questionContainer.setHTML(Y.Node.create(Y.Lang.sub(questionTemplate,question)));

		var answers = question.answers;
		var previousAnswer = this.get('model').get('answers')[question.id];

		for (var i = 0; i < answers.length; i++) {
			
			answerHTML = Y.one('#trivia-answer-template').getHTML();
			
			answerNode = Y.Node.create(Y.Lang.sub(answerHTML,answers[i]));

			answerNode.on(this.clickEvent,this.selectAnswer,this,{question: question.id, answer: i})

			if(i == previousAnswer){
				answerNode.addClass('selected');
			}

			questionContainer.appendChild(answerNode)
			
		}

		return this;
	}

  },{
		ATTRS: {
			container: {
				valueFn: function () {
					return Y.one('#trivia-app');
				}
			}
		}
	});
	
}, 1.0, {requires: ['base', 'node', 'event', 'event-touch', 'json', 'model', 'model-list', 'view']});