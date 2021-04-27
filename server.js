const express = require("express");
const http = require("http");

const app = express();
const server = http.createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

//user connection, socket is created
io.on("connection", (socket) => {
  console.log("Socket", socket.id);
  //return connected users socket id so that he can invite others using that id
  socket.emit("socketId", socket.id);

  socket.on("call-user", ({ userToCall, from, signalData, name }) => {
    //send data to socket of user that we are calling
    io.to(userToCall).emit("call-user", { name, from, signalData });
  });

  socket.on("call-answer", ({ to, signal }) => {
    io.to(to).emit("call-answered", signal);
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("call-end");
  });
});

server.listen(5000, () => console.log("Server up and running!"));
