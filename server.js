class Fetcher {
    constructor(){
        // maybe make this some {token:, user:} pair to prevent accessing two lists
        this.tokenList = [];
        this.userIDList = [];
        
    }
    
    addToken(newToken){
        this.tokenList.push(newToken);
    }
    
    addUserID(newUser){
        this.userIDList.push(newUser);
    }

    async choosePlaylist(randomIndex){
        console.log(`Using ${this.userIDList[randomIndex]}'s account`);
        let maxLength = 0;
        let result;
        let jsonResult;
        let playlists;
        while (maxLength === 0){ 
          result = await fetch(`https://api.spotify.com/v1/users/${this.userIDList[randomIndex]}/playlists`, {
            method: "GET", headers: { Authorization: `Bearer ${this.tokenList[randomIndex]}` }
          });
          jsonResult = await result.json();
          playlists = jsonResult.items;
          maxLength = playlists.length;

        }
        const index = Math.floor(Math.random()*maxLength);
        const tracksUrl = playlists[index].tracks.href;
        // console.log(playlists[index]);
        return tracksUrl;
    
      }
    
      async chooseSong(){
        let randomIndex;
        let url;
        let result;
        let jsonResult;
        let maxLength = 0;
        let index;
        while (maxLength === 0){
          randomIndex = Math.floor(Math.random()*this.tokenList.length);
          url = await this.choosePlaylist(randomIndex);
          result = await fetch(url, {
            method: "GET", headers: { Authorization: `Bearer ${this.tokenList[randomIndex]}` }
          });
          jsonResult = await result.json();
          console.log("jsonResult", jsonResult);
          maxLength = jsonResult.items.length;
          index = Math.floor(Math.random()*maxLength);
          console.log(maxLength, index);
        }
        const chosenTrack = jsonResult.items[index].track;
        // this.currentSong = chosenTrack.name;
        return chosenTrack.name; 
        // this.eventService.sendFetchedMessage({songName:chosenTrack});
        // console.log(chosenTrack);
    
      }
}

// websocket setup
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3001 });

// Store connected clients
let clients = [];

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // Add the new client to the list of clients
  clients.push(ws);

  // Send a welcome message to the newly connected client
//   ws.send(JSON.stringify({ message: 'Welcome, new client!' }));


  ws.on('message', async (message) => {
    const jsonMessage = JSON.parse(message);
    console.log("jsonMsg", jsonMessage);
    let chosenTrack;
    switch(jsonMessage.type){
        // should turn these into enum values at some point
        case "Auth":
            let token = jsonMessage.token;
            let userID = jsonMessage.userID;
            fetcher.addToken(token);
            fetcher.addUserID(userID);

            break;

        case "Start":
          chosenTrack = await fetcher.chooseSong();
          broadcastMessage({song:chosenTrack});
          break;
        
        case "Input":
            chosenTrack = await fetcher.chooseSong();
            broadcastMessage({song:chosenTrack});

    }

});

  ws.on('close', () => {
    // Remove the client from the list when disconnected
    clients = clients.filter(client => client !== ws);
    console.log('Client disconnected');
  });
});

// Send a message to all clients outside the 'connection' block
function broadcastMessage(message) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify( message )); // was originally {message}
    }
  });
}

// express setup

// const express = require('express');
// const app = express();
// const port = 3000;

// // Middleware to parse JSON request bodies
// app.use(express.json());
// const cors = require('cors');


// app.use(cors());



let fetcher = new Fetcher();

// // read token from client
// app.post('/sendToken', async (req, res) =>{
//     let token = req.body.token;
//     let userID = req.body.userID;
//     fetcher.setToken(token);
//     fetcher.setUserID(userID);

//     const chosenTrack = await fetcher.chooseSong();
//     broadcastMessage({song:chosenTrack});
//     res.send({song:chosenTrack});

//   });


// // Route to handle GET requests
// app.get('/hello', (req, res) => {
//   res.send({message:'Hello, world!'});
// });

// // Route to handle POST requests
// app.post('/data', (req, res) => {
//   console.log('Received data:', req.body);
//   res.json({ message: 'Data received successfully!' });
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server is listening on http://localhost:${port}`);
// });