class User {
    private name!: string
    private email!: string
    private username!: string
    private password!: string

    __constructor(name: string, email: string, username: string){
        this.name = name;
        this.email = email;
        this.username = username;
    }
}

class Author extends User {
        private recipes = <object[]>[];
         
        recipesMade(){
            return this.recipes.length;
        }

        getRecipes(){
            return this.recipes;
        }

        createRecipe(recName: string, desc: string, ingreds = <string[]>[]){
            const recipe = {
                name: recName,
                description: desc,
                ingredients: ingreds
            };

            return recipe
        }



}

export {User, Author}