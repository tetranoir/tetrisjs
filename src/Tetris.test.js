import React from 'react';
import ReactDOM from 'react-dom';
import Tetris from './Tetris';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<Tetris />, div);
  ReactDOM.unmountComponentAtNode(div);
});
