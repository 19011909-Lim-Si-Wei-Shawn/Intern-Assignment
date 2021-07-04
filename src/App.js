import React, { Component } from 'react';
import Game from './Game';
import Board from './Board';
import PubNubReact from 'pubnub-react';
import Swal from "sweetalert2";  
import shortid  from 'shortid';
import './Game.css';
 
class App extends Component {
  constructor(props) {  
    super(props);
    this.pubnub = new PubNubReact({
        publishKey: "pub-c-fd4bf874-6940-4d4c-a511-4d4d0c67add1",
        subscribeKey: "sub-c-cda173e4-da34-11eb-8c90-a639cde32e15"  
    });
    
    this.state = {
      piece: '',
      isPlaying: false,
      isAdmin: false,
      isLocked: false,
      myTurn: false,
    };

    this.lobbyChannel = null;
    this.gameChannel = null;
    this.roomId = null;    
    this.pubnub.init(this);
  }  
  


    //============================================================Functions============================================================\\

    

  //Creating Room Channel {onPressCreate Function},
  onPressCreate = (e) => {
    this.roomId = shortid.generate().substring(0,5);
    this.lobbyChannel = 'tictactoelobby--' + this.roomId;

    this.pubnub.subscribe ({
      channels: [this.lobbyChannel],
      withPresence: true
    });

  //Swal Alerts,
  Swal.fire ({
    position: 'top',
    allowOutsideClick: false,
    title: 'Generated Room ID',
    text: this.roomId,
    width: 275,
    padding: '0.7em',
   
    customClass: {
        heightAuto: false,
        title: 'Header',
        popup: 'PopUps',
        confirmButton: 'Btn'
    }
  })

    //Changing State,
    this.setState ({
      piece: 'X',
      isAdmin: true,
      isLocked: true,
      myTurn: true,
    });   
  }

  //Joining Room Channel {onPressJoin Function},
  onPressJoin = (e) => {
    Swal.fire ({
      position: 'top',
      input: 'text',
      allowOutsideClick: false,
      inputPlaceholder: 'Enter Room ID',
      showCancelButton: true,
      confirmButtonColor: 'rgb(208,33,41)',
      confirmButtonText: 'Confirm',
      width: 275,
      padding: '0.7em',

      customClass: {
        heightAuto: false,
        popup: 'PopUps',
        confirmButton: 'BtnClass',
        cancelButton: 'BtnClass'
      } 
    })
    
    //Checking User Input,
    .then((result) => {
      if(result.value) {
        this.joinRoom(result.value);
      }
    })
  }

  //joinRoom Function,
  joinRoom = (value) => {
    this.roomId = value;
    this.lobbyChannel = 'tictactoelobby--' + this.roomId;

    //Checking Player in Channel,
    this.pubnub.hereNow ({
      channels: [this.lobbyChannel], 
      
    })
    
    .then((response) => { 
        if(response.totalOccupancy < 2) {
          this.pubnub.subscribe ({
            channels: [this.lobbyChannel],
            withPresence: true
          });
          
          this.setState ({
            piece: 'O',
          });  
          
          this.pubnub.publish ({
            message: {notRoomCreator: true,},
            channel: this.lobbyChannel
          });

        } 
        else{
          Swal.fire ({
            position: 'top',
            allowOutsideClick: false,
            title: 'Error',
            text: 'Room is Full, Unable to Join',
            width: 275,
            padding: '0.7em',

            customClass: {
                heightAuto: false,
                title: 'Header',
                popup: 'PopUps',
                confirmButton: 'Btn'
            }
          })
        }
    })
    
    .catch((error) => { 
      console.log(error);
    });
  }

  //Terminating Game {endGame Function},
  endGame = () => {
    this.setState ({
      piece: '',
      isPlaying: false,
      isAdmin: false,
      isLocked: false,
      myTurn: false,
    });

    this.lobbyChannel = null;
    this.gameChannel = null;
    this.roomId = null;  

    this.pubnub.unsubscribe ({
      channels : [this.lobbyChannel, this.gameChannel]
    });
  }

  //Removal of Players in Channel,
  componentWillUnmount() {
    this.pubnub.unsubscribe({
      channels : [this.lobbyChannel, this.gameChannel]
    });
  }
  
  //Checking Players in Channel,
  componentDidUpdate() {
    if(this.lobbyChannel != null) {
      this.pubnub.getMessage(this.lobbyChannel, (msg) => {
        //Occurs if Both Party is Logged In,
        if(msg.message.notRoomCreator) {
          this.gameChannel = 'tictactoegame--' + this.roomId;

          this.pubnub.subscribe({
            channels: [this.gameChannel]
          });

          this.setState({
            isPlaying: true
          });  

          //Ending Swal Alert,
          Swal.close();
        }
      }); 
    }
  }



    //============================================================Render Section============================================================\\


  
  render() {  
    return (  
        <div> 
          <div className="title">
            <p>Tic Tac Toe</p>
          </div>

          {
            !this.state.isPlaying &&
            <div className="game">
              <div className="board">
                <Board
                    squares={0}
                    onClick={index => null}
                  />  
                  
                <div className="BtnDiv">
                  <button 
                    className="BtnCreate"
                    disabled={this.state.isLocked}
                    onClick={(e) => this.onPressCreate()}
                    > Create 
                  </button>
                  <button 
                    className="BtnJoin"
                    onClick={(e) => this.onPressJoin()}
                    > Join 
                  </button>
                </div>                        
          
              </div>
            </div>
          }

          {
            this.state.isPlaying &&
            <Game 
              pubnub={this.pubnub}
              gameChannel={this.gameChannel} 
              piece={this.state.piece}
              isAdmin={this.state.isAdmin}
              myTurn={this.state.myTurn}
              xUsername={this.state.xUsername}
              oUsername={this.state.oUsername}
              endGame={this.endGame}
            />
          }
        </div>
    );  
  } 
}

export default App;