class User {
     static username;
     static password;
     static email;
     static interests = [];

    __constructor(name, email){
        this.username = name;
        this.email = email;
    }
}

class Creator extends User {
    __constructor(){
        
    }
    
    static expertise = [];
    static yearsCooked;
    static recipesMade;
    static popularRecipes = [];

}