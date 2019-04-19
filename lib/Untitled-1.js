function GitHubUser(username) {
	this.username = username;  
};

GitHubUser.prototype.fetchDetails = function (cb) {
  var self = this;
	cb = cb || function (){};
  if (this.userData) {
  	setTimeout(function () {
    	cb(self.userData);
    }, 0);
  } else {
    fetch("https://api.github.com/users/" + this.username, {method: 'GET'})
        .then(function (response){
          response.json()
            .then(function (data) {
                self.data = data;
                cb(data);
          });
        });
  }
  
};

GitHubUser.prototype.getData = function () {
	return this.userData;
}

var octocat = new GitHubUser('octocat');

octocat.fetchDetails(function (data) {
	console.log(data);
});
