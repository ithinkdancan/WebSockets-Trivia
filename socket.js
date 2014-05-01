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

var questions = require('./questions.json'); 

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