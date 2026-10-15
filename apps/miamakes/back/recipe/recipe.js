const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const uri = process.env.MONGODB_URI;

async function createRecipe(recipe = {}){
    // Create a recipe and add it to a collection
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection(process.env.MONGO_COLLECTION);
    const recipe_doc = {
        name: recipe.name,
        author: recipe.author,
        description: {description: recipe.desc.overall, nutrition: recipe.desc.nutrition},
        times: {prep: recipe.times.prep, cook: recipe.times.cook},
        ingredients: recipe.ingredients,
        steps: recipe.steps
    }

    const result = await collection.insertOne({
        recipe_doc
    })
}

async function createCookbook(db_name, collection_name){
    // Create a cookbook (collection) that stores recipes
}

async function readRecipe(){
    // Read a recipe from a cookbook (collection) and return the value
    const client = new MongoClient(uri);
    try { 
        await client.connect();
        const db_name = process.env.DB_NAME;
        const coll_name = process.env.DB_COLLECTION;
        const db = client.db(db_name);
        const collection = db.collection(coll_name);

        const recipe = await collection.find({}).toArray();
        console.log('Database query');
        if(recipe){
            
            return recipe;
        }
        else {
            console.log('Recipe not found');
            return null;
        }
    }
    catch(error) { 
        console.error("Error reading recipe: ", error);
    }
    finally {
        await client.close();
    }
}

async function deleteRecipe(db_name, collection_name, recipe_name){
    // Delete a recipe from a collection
}

async function editRecipe(db_name, collection_name, recipe_name){
    // Edit a recipe
}

module.exports = {
    readRecipe,
    createRecipe,
    deleteRecipe,
    editRecipe
}