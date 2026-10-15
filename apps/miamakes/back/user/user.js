const crypto = require('crypto');

class User {
    static name;
    static username;
    static email;
    static password;

    __constructor(name, email, user){
        this.name = name;
        this.email = email;
        this.user = user;
    }

    getName(){
        return this.name;
    }

    setName(name){
        this.name = name;
    }

    getEmail(){
        return this.email;
    }

    setEmail(email){
        this.email = email;
    }

    setUsername(user){
        this.username = user;
    }

    getUsername(){
        return this.username;
    }

    setPassword(password){
        this.password = crypto.createHash('sha256').update(password).digest('hex');
        return this.password;
    }
}

module.exports = User;