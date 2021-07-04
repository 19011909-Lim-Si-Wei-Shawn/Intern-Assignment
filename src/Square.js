//Importing Variable,
import React from 'react';

//Creating Class,
const Square = props => (
    <button className={'square'} onClick={props.onClick}>
        {props.value}
    </button>
);

export default Square;