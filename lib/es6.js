class GitHubUser {
    constructor(username) {
        this.username = username;          
    };

    fetchDetails(cb = function(){}) {
        if (this.userData) {
            setTimeout(() => cb(this.userData), 0);
        } else {
            fetch(`https://api.github.com/users/${this.username}`)
                .then((response) => response.json()) 
                .then((data) => {
                    this.userData = data;
                    cb(data);
                }).catch(error => {
                    cb(error);
                });
        }
        
    };
}

const octocat = new GitHubUser('octocat');
octocat.fetchDetails((data) => console.log(data));
