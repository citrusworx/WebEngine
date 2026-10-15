class Recipe {
    name;
    description;
    ingreds = [];
    time = {
        prep: Number,
        cook: Number 
    }
    directions = [

    ]
     
    nutrition = {

    }
    background;

    __constructor(name){
        this.name= name;
    }

    readName(){
        return this.name;
    }

    changeName(newName){
        this.name = newName;
    }

    getDescription(){
        return this.description;
    }

    changeDescription(newDesc){
        this.description = newDesc;
    }

    readRecipe(){
        return {name: this.name, description: this.description, steps: this.directions}
    }
}