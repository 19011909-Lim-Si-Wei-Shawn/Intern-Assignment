//Importing Variable,
import React from 'react';
import Board from './Board';
import Swal from "sweetalert2";  

//Creating Class,
class Game extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      squares: Array(9).fill(''),
      xScore: 0,
      oScore: 0,
      whosTurn: this.props.myTurn
    };

    this.turn = 'X';
    this.gameOver = false;
    this.counter = 0;
  }

  

    //============================================================Functions============================================================\\


    //When Any Action is being Made {onMakeMove Function},
    onMakeMove = (index) => {
      const squares = this.state.squares;
  
      //Checking Position Selected = Empty & Determining Player Turn,
      if(!squares[index] && (this.turn === this.props.piece)) { 
        squares[index] = this.props.piece;
  
        this.setState ({
          squares: squares,
          whosTurn: !this.state.whosTurn
        });
    
        //Opponent Turn,
        this.turn = (this.turn === 'X') ? 'O' : 'X';
  
        this.props.pubnub.publish ({
          message: {
            index: index,
            piece: this.props.piece,
            turn: this.turn
          },

          channel: this.props.gameChannel

        });  
  
        //Checker {Player Row Match},
        this.checkForWinner(squares)
      }
    }

    //Publishing Moves {publishMove Function},
  publishMove = (index, piece) => {
    const squares = this.state.squares;

    squares[index] = piece;
    this.turn = (squares[index] === 'X')? 'O' : 'X';

    this.setState ({
      squares: squares,
      whosTurn: !this.state.whosTurn
    });

    this.checkForWinner(squares)
  }

  //Check All Combinations {checkForWinner Function},
  checkForWinner = (squares) => {
    const possibleCombinations = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
  
    for (let i = 0; i < possibleCombinations.length; i += 1) {
      const [a, b, c] = possibleCombinations[i];

      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        this.announceWinner(squares[a]);
        return;
      }
    }

    //Incremental with Every Move,
    this.counter++;

    if(this.counter === 9) {
      this.gameOver = true;
      this.newRound(null);
    }
  };

  //End Game Announcement {announceWinner Function},
  announceWinner = (winner) => {
		let pieces = {
			'X': this.state.xScore,
			'O': this.state.oScore
		}
	
		if(winner === 'X') {
			pieces['X'] += 1;

			this.setState ({
				xScore: pieces['X']
			});
		}

		else{
			pieces['O'] += 1;

			this.setState({
				oScore: pieces['O']
			});
		}

		this.gameOver = true;
		this.newRound(winner);	
  }
  
  //Updating Player Turns,
  componentDidMount() {
    this.props.pubnub.getMessage(this.props.gameChannel, (msg) => {
      if(msg.message.turn === this.props.piece) {
        this.publishMove(msg.message.index, msg.message.piece);
      }

      //Starting New Round,
      else if(msg.message.reset) {
        this.setState ({
          squares: Array(9).fill(''),
          whosTurn : this.props.myTurn
        });

        this.turn = 'X';
        this.gameOver = false;
        this.counter = 0;
        Swal.close()
      }

      //Redirecting to Lobby after Game Ends,
      else if(msg.message.endGame) {
        Swal.close();
        this.props.endGame();
      }
    });
  }

  //Starting a New Game {newRound Function},
  newRound = (winner) => {
    let title = (winner === null) ? 'Tie game!' : `Player ${winner} won!`;

    //For Player O,
    if((this.props.isAdmin === false) && this.gameOver) {
      Swal.fire({  
        position: 'top',
        allowOutsideClick: false,
        title: title,
        text: 'Awaiting Response from Other Party',
        confirmButtonColor: 'rgb(208,33,41)',
        width: 275,

        customClass: {
            heightAuto: false,
            title: 'Header',
            popup: 'PopUps',
            confirmButton: 'Btn',
        } ,
      });

      this.turn = 'X';
    } 

    //For Player X,
    else if(this.props.isAdmin && this.gameOver) {
      Swal.fire({      
        position: 'top',
        allowOutsideClick: false,
        title: title,
        text: 'New Game?',
        showCancelButton: true,
        confirmButtonColor: 'rgb(208,33,41)',
        cancelButtonColor: '#aaa',
        cancelButtonText: 'No',
        confirmButtonText: 'Yes',
        width: 275,

        customClass: {
            heightAuto: false,
            title: 'Header',
            popup: 'PopUps',
            confirmButton: 'Btn',
            cancelButton: 'Btn'
        } ,
      })
      
      .then((result) => {
        //Starting New Game,
        if (result.value) {
          this.props.pubnub.publish ({
            message: {
              reset: true
            },

            channel: this.props.gameChannel

          });
        }

        else{
          //Ending Game,
          this.props.pubnub.publish ({
            message: {
              endGame: true
            },

            channel: this.props.gameChannel

          });
        }
      })      
    }
   }

  

    //============================================================Render Section============================================================\\



  render() {
    let Info;
    // Change to current player's turn
    Info = `${this.state.whosTurn ? "Your turn" : "Opponent's turn"}`;

    return (
      <div className="game">
        <div className="board">
          <Board
              squares={this.state.squares}
              onClick={index => this.onMakeMove(index)}
            />  
            <p className="status-info">{Info}</p>        
        </div>
        
        <div className="ScoreDiv">
          <div>
            <p>Player X: {this.state.xScore} </p>
          </div>

          <div>
            <p>Player O: {this.state.oScore} </p>
          </div>
        </div>   
      </div>
    );
  }
}

export default Game;