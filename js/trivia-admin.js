
Trivia.TeamModel = Backbone.Model.extend({

	defaults: {
		name: '',
		answers: [],
		correctAnswers: 0
	}

});



Trivia.TeamList = Backbone.Collection.extend({

  model: Trivia.TeamModel,

  comparator: function(team) {
	return - team.get("correctAnswers");
  },

  add: function(team, options) {

	    var isDupe = this.any(function(_team) { 
	        return _team.get('name') === team.name;
	    });

	    if (isDupe) { return false; }

	    Backbone.Collection.prototype.add.call(this, team, options);
	},

	getTeam: function (teamName) {

		return this.find(function(team){
			return team.get('name') == teamName;
		});

	}

});




Trivia.Leaderboard = Backbone.View.extend({

	el: $("#leaderboard"),

	initialize: function (config) {
		
		//get socket
		this.socket = this.options.socket;

		this.teamTemplate = Handlebars.compile($('#trivia-team-template').html());

		this.yPos = 0;

		//create new collection of teams
		this.teamlist = new Trivia.TeamList;

		this.socket.on('teamList', $.proxy(this.updateTeams, this));
		this.socket.on('newClient', $.proxy(this.addTeam, this));
		this.socket.on('numresponses', $.proxy(this.updateResponders, this));
		this.socket.on('gameOver', $.proxy(this.gameOver, this));
		this.teamlist.on('add', this.addOneTeam, this)
		this.teamlist.on('add', this.removeWaiter, this)


	},

	updateResponders: function (data) {
		console.log('updateResponders', data)

		for (var i = 0; i < data.respondedTeams.length; i++) {
			
			var team = this.teamlist.getTeam(data.respondedTeams[i]);
			
			if(team){
				console.log('found my team!', team)
				$('#' + team.cid).addClass('answered');
			}
		};


	},

	gameOver: function () {

		this.$el.addClass('game-over');

	},

	createTeam: function (data){

		var team = $(this.teamTemplate(data.toJSON()));
		team.attr('id', data.cid)
		team.css('top',this.yPos);
		
		return team;

	},

	addOneTeam: function (data) {

		var team = this.createTeam(data);

		this.$el.append(team);
		this.yPos += team.outerHeight();

		team.removeClass('loading');
		 this.removeWaiter();

	},

	removeWaiter: function () {
		this.$el.find('.waiting').remove();
		this.teamlist.off('add', this.removeWaiter)
	},

	addTeam: function (data) {
		console.log('addTeam')
		this.teamlist.add(data, {silent: false});
	},

	repaintTeams: function () {

		this.yPos = 0;
		var teamEl;

		$('.answered').removeClass('answered');

		this.teamlist.each($.proxy(function(team){
			teamEl = $('#' + team.cid);
			if(teamEl[0]){
				teamEl.html(this.createTeam(team).html())
				teamEl.css('top',this.yPos);
				this.yPos += teamEl.outerHeight();
			} else {
				this.addOneTeam(team)
			}
		},this))

	},

	updateTeams: function (data) {
		
		console.log('updateTeams', data);

		for(o in data){
			var team = this.teamlist.getTeam(data[o].name);
			if(team){
				team.set(data[o]);
			} else {
				this.teamlist.add(data[o],{silent:true});
			}
		}

		this.teamlist.sort();
		this.repaintTeams();

	}


})









Trivia.Admin = Trivia.App.extend({

	application: 'admin',

	initialize: function (config) {

		Trivia.App.prototype.initialize.call(this,config);

		this.key = config.auth;

		this.leaderboard = new Trivia.Leaderboard({
			socket: this.socket
		});

	},
	
	//do nothing when an answer is selected
	selectAnswer : function () {},

	register : function () {},

	nextQuestion: function () {
		this.socket.emit('admin', { action: 'next', key: this.key});
	},

	resetApp: function () {
		this.socket.emit('admin', { action: 'reset', key: this.key });
	},

	showAnswer: function () {
		socket.emit('admin', { action: 'end', key: this.key });
	},

	setDefaultContent: function () {
		var questionText = this.questionTemplate({text:'http://bit.ly/webdevtrivia'});
		this.$el.html(questionText)
	},

	handleKeyPress: function (event) {

		//s: 115 /n: 110 /a: 97 /r: 114
		switch (event.which) {
			case 115:
			case 110:
				this.nextQuestion();
				break;
			case 97:
				this.showAnswer();
				break;
			case 114:
				this.resetApp();
				break;

			default:
				console.log(event.which);
				break;
		}

	},

	renderResult: function (data) {
		
		var answers = this.$el.find('.trivia-answer')

		answers.addClass('incorrect');
		$(answers[data.correctAnswer]).addClass('correct')

	},

	gameOver: function () {

		var questionText = this.questionTemplate({text: 'Game Over!'});
		this.$el.html(questionText)

	},

	attachListeners: function () {

		//subscribe to socket events
		this.socket.on('results',$.proxy(this.renderResult, this));
		this.socket.on('gameOver', $.proxy(this.gameOver, this));

		//subscribe to model changes
		this.model.on('change:question', this.render, this);

		$(document).keypress($.proxy(this.handleKeyPress, this));

	}

})