//Creating Variable,
import React from 'react';
import Square from './Square';

//Creating Class,
class Board extends React.Component {
    createBoard(row, col) {
        const Board = [];
        let BCounter = 0;

        for(let i = 0; i < row; i += 1) {
            const Col = [];

            for(let x = 0; x < col; x += 1) {
                Col.push(this.renderSquare(BCounter++));
            }

            Board.push(<div key={i} className="Board-Rows"> {Col}</div>);
        }

        return Board;
    }



    //============================================================Functions============================================================\\



    renderSquare(i) {
        return (
            <Square 
                key={i}
                value={this.props.squares[i]}
                onClick={() => this.props.onClick(i)} />
        );
    }

    render() {
        return <div>{this.createBoard(3, 3)}</div>;
    }

}

export default Board;