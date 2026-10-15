const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = 'mongodb+srv://' + `${process.env.DB_USERNAME}` + ':' + `${process.env.DB_USER_PASS}` + '@' + `${process.env.DB_CLUSTER}` + '/?retryWrites=true&w=majority';
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  
async function db_start() {
    try {
        await client.connect();
        await client.db("admin").command({ping: 1});
        console.log('Success');
        return client;
    }
    catch(error){ 
        console.error('Error connecting to the db: ', error);
    }
}

async function db_stop() {    
    try{
        await client.close();
        console.log("Db connection closed");
    }
    catch(error) {
        console.error('Error closing the db:'. error);
    }    
}
console.log(uri);
module.exports = {
    db_start,
    db_stop
}