const express = require('express');
const app = express();
const {graphqlHTTP} = require('express-graphql');
const {buildSchema} = require('graphql');
const port = 3001;
const schema = buildSchema(`
type Query {
    hello: String
}
`);

const root = {
    hello: () => {
        return 'Hello, World!';
    }
}

app.listen(port, () => {
    console.log('Graphql is listening on port: ' + port)
});

app.use('/graphql', graphqlHTTP({
    schema: buildSchema,
    rootValue: root,
    graphiql: true,
}))