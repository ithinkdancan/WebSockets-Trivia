var 
	express = require("express"),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);

var currentQuestion = 0;

var teams = {};

var questions = [
	{
		'text' : 'Which CSS Selector has the highest specificity',
		'answers' : [
			{ text: '#section .title'},
			{ text: '#section *'},
			{ text: '.section'}
		],
		correct : 0
	},{
		'text' : 'Which of the following would make x global',
		'answers' : [
			{ text: 'function () { var x = 5; }'},
			{ text: 'function () { x = 5; }'},
			{ text: 'function () { this.x = 5; }'}
		],
		correct : 1 
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


//Create a new team
registerClient = function (data){

	if(!teams[data.team]){
		console.log('registering a client: ' + data.team)
		teams[data.team] = {
			name: data.team,
			answers: []
		}
	} else {
		console.log('team exists: ' + data.team)
	}

	broadcastQuestion(currentQuestion,this);
	broadcastTeams();
	broadcastNumResponses();
}

logAnswer = function (data) {

	 if(data.team && !teams[data.team]){
		registerClient.call(this, data)
	 }
	console.log(teams)
	console.log(data)

	if(teams[data.team] && data.question == currentQuestion){
		teams[data.team].answers[data.question] = data.answer;
		broadcastNumResponses();
	} else {
		console.log('team not found' + data.team);
		console.log(teams)
	}

	
};

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

	switch (data.action) {
		case 'next': 
			nextQuestion.call(this, data); 
			break;
		case 'end':
			broadcastQuestionResults.call(this, data);
			break;
		default: 
			console.log('Unknown Admin Action')
			console.log(data)
	}

}

//sends out the next question
nextQuestion = function () {
	currentQuestion++;
    if(currentQuestion >= questions.length){ 
    	currentQuestion = 0; 
    }

    broadcastQuestion(currentQuestion);
    broadcastNumResponses();
}

//sends out the question, options, correct answer, and team selections
broadcastQuestionResults = function () {

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

broadcastNumResponses = function () {

	var numResponses = 0;
	var numTeams = 0;

	for(o in teams){
		numTeams++;
		if(teams[o].answers[currentQuestion] >= 0){
			numResponses++;
		}
	}

	io.sockets.emit('numresponses', {
		responses : numResponses,
		teams: numTeams
	});
}

broadcastTeams = function (){

}

//Send a question to all clients or a single socket
broadcastQuestion = function (id, socket){
	var question = questions[currentQuestion];
	question.id = currentQuestion;
	if(socket){
		socket.emit('question', question);
	} else {
		io.sockets.emit('question', question);
	}
	
}


//Create Socket Listeners
io.sockets.on('connection', function (socket) {
  socket.on('client', handleClient);
  socket.on('admin', handleAdmin);	

  broadcastQuestion(currentQuestion, socket);

});