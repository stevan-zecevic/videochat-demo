import React, { useRef, useState, useEffect } from "react";
import { Button, IconButton, TextField } from "@material-ui/core";
import PhoneIcon from "@material-ui/icons/Phone";
import io from "socket.io-client";
import Peer from "simple-peer";
import "./App.css";

const socket = io.connect("http://localhost:5000");

const App = () => {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAnswered, setCallAnswered] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    socket.on("socketId", (id) => {
      setMe(id);
    });

    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        setStream(stream);
        myVideo.current.srcObject = stream;
      });

      socket.on("call-user", (data) => {
        setReceivingCall(true);
        setCaller(data.from);
        setName(data.name);
        setCallerSignal(data.signalData);
      });
    } else {
      setError("Camera not found!");
    }
  }, []);

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("call-user", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name,
      });
    });
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });
    socket.on("call-answered", (signal) => {
      setCallAnswered(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAnswered(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("call-answer", { signal: data, to: caller });
    });
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
  };

  return (
    <>
      <h1 style={{ textAlign: "center" }}>Demo</h1>
      <div className="container">
        <div className="video-container">
          {error.length > 0 ? (
            <h1>{error}</h1>
          ) : (
            <>
              <div className="video">
                {stream && (
                  <video playsInline muted ref={myVideo} autoPlay style={{ width: "300px" }} />
                )}
              </div>
              <div className="video">
                {callAnswered && !callEnded ? (
                  <video playsInline ref={userVideo} autoPlay style={{ width: "300px" }} />
                ) : null}
              </div>
            </>
          )}
        </div>
        <div className="myId">
          <TextField
            label="Name"
            variant="filled"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginBottom: "20px" }}
          />

          <TextField
            label="ID to call"
            variant="filled"
            value={idToCall}
            onChange={(e) => setIdToCall(e.target.value)}
          />

          <TextField id="myId" label="My ID" variant="filled" value={me} />
          <div className="call-button">
            {callAnswered && !callEnded ? (
              <Button variant="contained" color="secondary" onClick={leaveCall}>
                End Call
              </Button>
            ) : (
              <IconButton color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
                <PhoneIcon fontSize="large" />
              </IconButton>
            )}
            {idToCall}
          </div>
        </div>
        <div>
          {receivingCall && !callAnswered ? (
            <div className="caller">
              <h1>{name} is calling...</h1>
              <Button variant="contained" color="primary" onClick={answerCall}>
                Answer
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default App;
