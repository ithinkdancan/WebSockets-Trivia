
Trivia.TeamModel = Backbone.Model.extend({

	defaults: {
		name: '',
		answers: [],
		correctAnswers: 0
	},

	initialize: function (config) {
		
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

		//create new collection of teams
		this.teamlist = new Trivia.TeamList;

		this.socket.on('teamList', $.proxy(this.updateTeams, this));
		this.socket.on('newClient', $.proxy(this.addTeam, this));
		this.socket.on('numresponses', $.proxy(this.updateResponders, this));
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

	addOneTeam: function (data) {

		var team = $(this.teamTemplate(data.toJSON()));
			team.attr('id', data.cid)
		
		this.$el.append(team)

		setTimeout($.proxy(function(){
			this.removeClass('loading')
		},team), 0 /*100 + (500*this.teamlist.length)*/)

	},

	removeWaiter: function () {
		this.$el.find('.waiting').remove();
		this.teamlist.off('add', this.removeWaiter)
	},

	addTeam: function (data) {
		console.log('addTeam')
		this.teamlist.add(data, {silent: false});
	},

	repaintTimeout: false,

	removeTeams: function () {

		var that = this, i = 0;

		this.$el.find('.trivia-team').each(function(){
			setTimeout(
				$.proxy(function(){ $(this).addClass('destroy'); }, this)
				,250*i++
			);

			if(that.repaintTimeout) clearTimeout(that.repaintTimeout);
			that.repaintTimeout = setTimeout($.proxy(that.repaintTeams, that),1000+(250*(i-1))); 
		})

		if(!that.repaintTimeout){
			this.repaintTeams();
		}

	},

	repaintTeams: function () {

		this.$el.html('');
		var i = 0;

		this.teamlist.each($.proxy(function(team){
			setTimeout( $.proxy(function(){this.addOneTeam(team)}, this), 250*i);
			i++;
		},this));

	},

	resetTeams: function (){

		this.removeTeams();

		// console.log('repaintTeams')
		// var that = this;
		// var i = 0;

		// this.$el.find('.trivia-team').each(function(){
		// 	setTimeout(
		// 		$.proxy(function(){ 
		// 			$(this).addClass('destroy'); 
		// 		}, this)
		// 	,250*i++);
		// })

		// setTimeout(function(){
		// 	that.$el.html('');
		// 	that.teamlist.each(function(team){ 
		// 		that.addOneTeam(team)
		// 	});
		// }, 1000*(i-1));

	},

	updateTeams: function (data) {
		console.log('updateTeams', data);

		for(o in data){
			var team = this.teamlist.getTeam(data[o].name);
			if(team){
				team.set(data[o]);
			} else {
				this.teamlist.add(data[o], {silent: true});
			}
		}

		this.teamlist.sort();

		this.resetTeams();

		// //hide old
		// this.$el.html('');

		// this.teamlist.sort().each(function(team){ 
		// 	that.addOneTeam(team)
		// });

		// console.log('repaintTeams', this.teamlist);

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

	nextQuestion: function () {
		console.log('nextQuestion');
		this.socket.emit('admin', { action: 'next', key: this.key});
	},

	resetApp: function () {
		console.log('resetApp')
		this.socket.emit('admin', { action: 'reset', key: this.key });
	},

	showAnswer: function () {
		console.log('showAnswer');
		socket.emit('admin', { action: 'end', key: this.key });
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

	attachListeners: function () {

		//subscribe to socket events
		//this.socket.on('results', $.proxy(this.renderResult, this));
		this.socket.on('results',$.proxy(this.renderResult, this));

		//subscribe to model changes
		this.model.on('change:question', this.render, this);

		$(document).keypress($.proxy(this.handleKeyPress, this));

	}

})