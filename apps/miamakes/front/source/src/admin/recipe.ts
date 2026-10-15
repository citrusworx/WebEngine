class Recipe {
    private name!: string
    private author!: string
    private description!: string
    private time = {
        prep: 0,
        cook: 0,
    }
    private ingredients = <string[]>[]
    private steps = <string[]>[]
    private nutrition = {}


    __constructor(name: string, author: string){
        this.name = name;
        this.author = author;
    }

    getName(){
        return this.name;
    }

    updateName(name: string){
        this.name = name;
    }

    getAuthor(){
        return this.author;
    }

    updateAuthor(name: string){
        this.author = name;
    }

    getDesc(){
        return this.description;
    }

    changeDesc(content: string){
        this.description = content;
    }

    getPrepTime(){
        return this.time.prep;
    }

    setPrepTime(prep: number){
        this.time.prep = prep;
    }

    getCookTime(){
        return this.time.cook;
    }
    
    setCookTime(time: number){
        this.time.cook = time;
    }

    addIngred(ingred: string){
       this.ingredients.push(ingred);
    }

    getIngreds(){
        return this.ingredients;
    }

    addStep(step: string){
        this.steps.push(step);
    }

    getSteps(){
        return this.steps;
    }
}

export default Recipe;