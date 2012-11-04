	
	var Trivia = Trivia || {};
	
	Trivia.Auth = function (key, callback) {

		this.key = key || this.key;

		this.authCallback = callback;

		this.init();

	}

	Trivia.Auth.prototype = {

		key : 'TeamName',

		init : function () {

			var team = localStorage.getItem(this.key);

			if(!team){
				this.getTeam();
			} else {
				this.save(team);
			}
		
		},

		save: function (team) {

			localStorage.setItem(this.key,team);
			this.authCallback(team);
			$('#trivia-app').html('');

		},

		submitTeam : function (event) {

			//get the form
			var form = $(event.target);

			//get the teamname
			var teamName = $.trim(form.find('[name="'+this.key+'"]').val());

			//save teamname
			if(teamName){
				this.save(teamName);
			} else {
				//throw error
			}

		},

		getTeam : function () {

			//build form from template
			var templateHtml = Handlebars.compile($('#trivia-auth-template').html());
			var authForm = $(templateHtml({key: this.key}));

			//Attach submit listener
			authForm.bind('submit', $.proxy(this.submitTeam, this));
			
			//append to body
			$('#trivia-app').html(authForm);

		}

	}