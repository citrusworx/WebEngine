import { Seltzer } from "@citrusworx/seltzer";
// The server needs to be a sum of routes and handlers.
// 
// server.route({
//   method: 'GET',
//   path: '/users',
//   handler: getUsersHandler()
// });
//   
// This calls the WP API to get the users and returns them as JSON.   

// server.listen() starts the server and listens for incoming requests. It should be called after all routes and handlers have been defined.

const server = new Seltzer();

function getUsersHandler(ctx: any): any {
    // Implementation for handling user retrieval
}
const context = {
    // This is where you can add any context that you want to be available in the handlers. For example, you can add a database connection or a logger.
    };



server.route({
  method: 'GET',
  path: '/users',
  handler: getUsersHandler(context)
});

server.listen(3000);
