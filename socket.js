var 
	express = require("express"),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);

io.set('log level', 1)

var currentQuestion = false;

var questionActive = false;

var secKey = 'qwerty';

var teams = {};

var questions = [
	{
		'text' : 'Who is the creator of Javascript?',
		'answers' :  [
			{ text: 'Douglas Crockford'},
			{ text: 'Brendan Eich'},
			{ text: 'Marijn Haverbeke'},
			{ text: 'John Resig'}
		],
		correct : 1
	},{
		'text' : 'Which of the following is NOT a MVC Framework?',
		'answers' :  [
			{ text: 'Angular'},
			{ text: 'Backbone'},
			{ text: 'Batman'},
			{ text: 'Structs'}
		],
		correct : 3 
	},{
		'text' : 'How do you create a new YUI3 sandbox?',
		'answers' :  [
			{ text: 'Y.use(...)'},
			{ text: 'YUI().use(...)'},
			{ text: 'YUI.use(...)'},
			{ text: 'Y().use(...)'}
		],
		correct : 1
	},{
		'text' : 'What does CSS stand for?',
		'answers' : [
			{ text: 'Creative Style Sheets'},
			{ text: 'Computer Style Sheets'},
			{ text: 'Cascading Style Sheets'},
			{ text: 'Colorful Style Sheets'}
		],
		correct : 2 
	},{
		'text' : 'Which of the following is NOT a reserved word in Javascript?',
		'answers' : [
			{ text: 'break'},
			{ text: 'finally'},
			{ text: 'small'},
			{ text: 'package'}
		],
		correct : 2 
	},{
		'text' : 'Which of the following is NOT a valid CSS \'display\' property',
		'answers' : [
			{ text: 'none'},
			{ text: 'block'},
			{ text: 'inline'},
			{ text: 'hidden'},
			{ text: 'run-in'}
		],
		correct : 3 
	},{
		'text' : 'In which year is the HTML specification supposed to be complete and finalized?',
		'answers' : [
			{ text: '2022'},
			{ text: '2015'},
			{ text: '2019'},
			{ text: '2013'}
		],
		correct : 0
	},{
		'text' : 'Which of the following conditions evaluates to True?',
		'answers' : [
			{ text: 'NaN === NaN'},
			{ text: '0.1 + 0.2 == 0.3'},
			{ text: '"string" instanceof String'},
			{ text: 'typeof NaN === "number"'}
		],
		correct : 3
	},{
		'text' : 'What javascript method returns which character occurs at the 5th position in a string?',
		'answers' : [
			{ text: 'Substring()'},
			{ text: 'String()'},
			{ text: 'Stringlength()'},
			{ text: 'CharAt()'}
		],
		correct : 3
	},{
		'text' : 'Which of these declarations will result in a box whose bottom right corner has a radius of 20px?',
		'answers' : [
			{ text: 'border-radius: 40px 20px;'},
			{ text: 'border-radius: 40px 20px 20px 80px;'},
			{ text: 'border-radius: 20px 20px 40px 20px;'},
			{ text: 'border-radius: 20px 40px 60px 80px;'}
		],
		correct : 1
	},{
		'text' : 'Which of the following conditions does not evaluate to False?',
		'answers' : [
			{ text: '0'},
			{ text: '\'\''},
			{ text: 'Nan'},
			{ text: 'undefined'},
			{ text: 'new Boolean(false)'}
		],
		correct : 4
	},{
		'text' : 'Which of the following methods & properties does not cause a DOM reflow?',
		'answers' : [
			{ text: 'offsetHeight'},
			{ text: 'scrollTop'},
			{ text: 'innerText'},
			{ text: 'createDocumentFragment'}
		],
		correct : 3
	},{
		'text' : 'Which of the following events fire first on a touch device?',
		'answers' : [
			{ text: 'touchdown'},
			{ text: 'touchstart'},
			{ text: 'touchmove'},
			{ text: 'touchbegin'}
		],
		correct : 1
	},{
		'text' : 'What is the maximum number of CSS files that you can include on a single page in Internet Explorer?',
		'answers' : [
			{ text: '16'},
			{ text: '32'},
			{ text: '100'},
			{ text: 'no limit'}
		],
		correct : 1
	},{
		'text' : 'How many performance rules are evaluated in the Yslow tool?',
		'answers' : [
			{ text: '12'},
			{ text: '18'},
			{ text: '23'},
			{ text: '32'}
		],
		correct : 2
	},{
		'text' : 'Which CSS selector has the highest specificity?',
		'answers' : [
			{ text: '#section input'},
			{ text: '.section input'},
			{ text: '.section .input'},
			{ text: '#section #input'}
		],
		correct : 3
	},{
		'text' : 'What does the third value in the declaration specify in the declaration "box-shadow: 5px 5px 5px #888;"? ',
		'answers' : [
			{ text: 'X Offset'},
			{ text: 'Y Offset'},
			{ text: 'Blur Radius'},
			{ text: 'Margin'}
		],
		correct : 2
	},{
		'text' : 'How do you loop through the properites of an object?',
		'answers' : [
			{ text: 'for(o in object){ }'},
			{ text: 'for(i=0;i<o.length;i++){ }'},
			{ text: 'foreach(o in object){ }'},
			{ text: 'while(o in object){ }'}
		],
		correct : 0
	},{
		'text' : 'Which of these is NOT a templating framework?',
		'answers' : [
			{ text: 'Handlebars'},
			{ text: 'Mustache'},
			{ text: 'Jade'},
			{ text: 'Curlies'}
		],
		correct : 3
	},{
		'text' : 'Who coined the term AJAX?',
		'answers' : [
			{ text: 'Chris Ullman'},
			{ text: 'John Resig'},
			{ text: 'Douglas Crockford'},
			{ text: 'Jesse James Garrett'}
		],
		correct : 3
	},{
		'text' : 'Which of the following Javascript Engines does FireFox use?',
		'answers' : [
			{ text: 'V8'},
			{ text: 'Spider Monkey'},
			{ text: 'SquirrelFish'},
			{ text: 'Chakra'}
		],
		correct : 1
	},{
		'text' : 'Which of the following Components is not part of YUI3 App Framework?',
		'answers' : [
			{ text: 'Model'},
			{ text: 'App'},
			{ text: 'Model List'},
			{ text: 'Controller'},
			{ text: 'View'}
		],
		correct : 3
	},{
		'text' : 'What type of variable scoping does javascript implement',
		'answers' : [
			{ text: 'Functional'},
			{ text: 'Block'},
			{ text: 'Class'},
			{ text: 'None of the above'}
		],
		correct : 0
	},{
		'text' : 'Who coined the term JSON?',
		'answers' : [
			{ text: 'Chris Ullman'},
			{ text: 'John Resig'},
			{ text: 'Douglas Crockford'},
			{ text: 'Jesse James Garrett'}
		],
		correct : 2
	}
]

server.listen(8080);

//Create App Paths
app.use("/js", express.static(__dirname + '/js'));
app.use("/css", express.static(__dirname + '/css'));
app.use("/sounds", express.static(__dirname + '/sounds'));
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});
app.get('/admin', function (req, res) {
  res.sendfile(__dirname + '/admin.html');
});

app.get('/admin2', function (req, res) {
  res.sendfile(__dirname + '/admin2.html');
});


//Create a new team
registerClient = function (data){

	if(!teams[data.team]){

		console.log('registering a client: ' + data.team)
		teams[data.team] = {
			name: data.team,
			answers: [],
			correctAnswers : 0
		}
	} else {
		console.log('team exists: ' + data.team)
	}

	broadcastQuestion(currentQuestion,this);	
	broadcastTeam(teams[data.team]);

}

logAnswer = function (data) {

	 if(data.team && !teams[data.team]){
		registerClient.call(this, data)
	 }

	console.log('got an answer');	

	if(teams[data.team] && data.question == currentQuestion){
		teams[data.team].answers[data.question] = data.answer;
		broadcastNumResponses();
	} else {
		console.log('team not found' + data.team);
	}

	
};



//sends out the next question
nextQuestion = function () {
	
	var nextQuestion = currentQuestion;

	if(nextQuestion === false ) {
		nextQuestion = 0;
	} else {
		nextQuestion++;
	}
	
    if(questions[nextQuestion]){
    	currentQuestion = nextQuestion;
    	questionActive = true;
    	broadcastQuestion(currentQuestion);
    	broadcastTeams();
    } else {
    	broadcastGameOver();
    	console.log(teams);
    }

   

}

broadcastGameOver = function () {

	io.sockets.emit('gameOver', {});
	broadcastTeams();
	questionActive = false;

}

//sends out the question, options, correct answer, and team selections
broadcastQuestionResults = function () {

	questionActive = false;
	console.log('question inactive broadcast')

	if(questions[currentQuestion]){

		var question = questions[currentQuestion];

		var data = {
			id:currentQuestion,
			text : question.text,
			answers: question.answers,
			correctAnswer: question.correct,
			results: []
		}

		io.sockets.emit('results', data);
	}


}

broadcastNumResponses = function () {

	var respondedTeams = [];
	var numResponses = 0;
	var numTeams = 0;

	for(o in teams){
		numTeams++;
		if(teams[o].answers[currentQuestion] >= 0){
			numResponses++;
			respondedTeams.push(teams[o].name)
		}
	}

	io.sockets.emit('numresponses', {
		responses : numResponses,
		teams: numTeams,
		respondedTeams: respondedTeams
	});
}

broadcastTeams = function (socket){

	console.log(teams);

	for (var i in teams) {
		teams[i].correctAnswers = 0;
		for (var j = 0; j <= currentQuestion; j++) {
			if(teams[i].answers[j] == questions[j].correct){
				teams[i].correctAnswers++;
			}
		}
	}

	if(Object.keys( teams ).length){
		if(socket){
			socket.emit('teamList', teams);
		} else {
			io.sockets.emit('teamList', teams)
		}
	}
	
}

broadcastTeam = function (team, socket){
	console.log('broadcastTeam')
		team.correctAnswers = 0;
		for (var j = 0; j <= currentQuestion; j++) {
			if(team.answers[j] == questions[j].correct){
				team.correctAnswers++;
			}
		}

		if(socket){
			socket.emit('newClient', team);
		} else {
			io.sockets.emit('newClient', team)
		}
	
}

//

//Send a question to all clients or a single socket
broadcastQuestion = function (id, socket){
	console.log('broadcastQuestion', questionActive)
	if(questionActive){
		var question = questions[currentQuestion];

		var data = {
			id: currentQuestion,
			text : question.text,
			answers: question.answers,
			results: []
		}

		console.log('sending Question', data)
		
		if(socket){
			socket.emit('question', data);
		} else {
			io.sockets.emit('question', data);
		}

		broadcastNumResponses();

	}
	
	
}


//Handle Client Actions
handleClient = function (data) {
		
	switch(data.action){
		case 'register': 
			registerClient.call(this, data);
			break;
		case 'answer':
			logAnswer.call(this,data)
			break;
		default: 
			console.log('Unknown Client Action')
			console.log(data)
	}
}

//handles admin actions
handleAdmin = function(data) {

	if(data.key !== secKey){
		console.log('Bad Admin!');
		console.log(data)
		return;
	}

	switch (data.action) {
		case 'next': 
			nextQuestion.call(this, data); 
			break;
		case 'end':
			broadcastQuestionResults.call(this, data);
			break;
		case 'reset':
			currentQuestion = false;
			questionActive = false;
			teams = {};
			break;
		case 'register':
			broadcastQuestion.call(this, currentQuestion, this);
			break;
		default: 
			console.log('Unknown Admin Action')
			console.log(data);
			break;
	}

}


//Create Socket Listeners
io.sockets.on('connection', function (socket) {
  
  socket.on('client', handleClient);
  socket.on('admin', handleAdmin);	

  broadcastQuestion(currentQuestion, socket);
  broadcastTeams(socket)

});