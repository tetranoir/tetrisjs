import React from 'react';
import ReactDOM from 'react-dom';
import './normalize.css';
import './index.css';
import Tetris from './Tetris';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<Tetris />, document.getElementById('root'));
registerServiceWorker();
