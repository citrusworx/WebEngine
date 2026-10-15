const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const {db_start, db_stop} = require('./db.js');
const {readRecipe} = require('./recipe/recipe.js');
const User = require('./user/user.js');

const app = express();
const PORT = 3001;

// MUST FOR VANILLA JS LIB
app.use(bodyParser.json());
app.use(cors());

const Drew = new User('Drew', 'drewwinkles@gmail.com', 'Stinklewinks');
console.log(Drew.setPassword('@St1nkl3n3t0933!'));

// ROUTES
app.get('/', async (req, res) => {
    try {
        const allRecipes = await readRecipe('your-database-name', 'your-collection-name');

        if (allRecipes.length > 0) {
            res.json(allRecipes); // Send the recipes as JSON
        } else {
            res.status(404).json({ message: 'No recipes found.' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/recipe', async (req, res) => {
    const recipeData = req.body;

    if(!recipeData){
        return res.status(400).json({error: 'Must contain recipe'})
    }

    try {
        await createRecipe(recipeData);
        console.log('Successful recipe entry');
    }
    catch (error) {
        console.error('Error adding recipe:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
})


// Server
async function start(){
    try{
        db_start();
        app.listen(PORT, ()=>{
        console.log(`Console is listening on port: ${PORT}`);
    });
    }
    catch(error) {
        console.error('Error starting the db and server: ', error);
    }
}

async function stop(){
    await db_stop();
}

start();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Received SIGINT. Closing server and database connection...');
    stopServer().finally(() => {
        process.exit(0);
    });
});