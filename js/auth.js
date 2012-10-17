YUI.add('auth', function (Y) {
  
	Y.authApp = function (callback) {

		this.authCallback = callback;

		this.init();

	}

	Y.authApp.prototype = {

		key : 'team1',

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
			Y.one('#trivia-auth').setHTML('')

		},

		submitTeam : function (event) {

			var form = event.currentTarget;
			var team = Y.Lang.trim(form.get(this.key).get('value'));

			if(team){
				this.save(team);
			} else {
				//throw error
			}

		},

		getTeam : function () {

			var templateHtml = Y.one('#trivia-auth-template').getHTML();
			
			var template = Y.Lang.sub(templateHtml,{key: this.key});
			
			var authForm = Y.Node.create(template);
				authForm.on('submit', this.submitTeam, this)
			
			var container = Y.one('#trivia-auth');

			container.setHTML(authForm);

		}

	}
});