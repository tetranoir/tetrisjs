import React, { Component } from 'react';
import { useSpring } from 'react-spring';
import { cloneDeep } from 'lodash';
import PropTypes from 'prop-types';

import Blocks from './Blocks';

// dev config
const GRAVITY_ON = true; // toggles gravity
const TIMEUPDATE_ON = true; // toggles the showing the timer
const GRAVITY_AFTER_DOWN = true; // toggles gravity interval considers down action as a gravity

// UTIL
// fps constants
const FP = {
  S60: 17,
  S30: 34,
  S24: 42,
};
const BLOCK = {
  empty: 0,
  filled: 1,
};
const LevelGravity = [
  1,
  .717,
  .633,
  .55,
  .467,
  .383,
  .3,
  .217,
  .133,
  .1,
  .083, .083, .083, // 10, 11, 12
  .067, .067, .067, // 13, 14, 15
  .05, .05, .05, // 16, 17, 18
  .033, .033, .033, .033, .033, .033, .033, .033, .033, .033, // 19 - 28
  .017, .017, .017, .017, // 29+ 
]; // SNES framerates

// for function application-like syntax
const app = (obj, ...fns) => {
  return fns.reduce((o, fn) => fn(o), obj);
};
// rotate matrix 90 cw
const rot90 = m => {
  const n = new Array(m.length).fill().map(() => new Array(m[0].length).fill(0));
  for (let i = 0; i < m.length; i++) {
      for (let j = 0; j < m[0].length; j++) {
          n[j][m.length - i - 1] = m[i][j];
      }
  }
  return n;
};

// components and styles
const TRowStyle = {
  display: 'flex',
};
const TNextRowStyle = {
  display: 'flex',
  justifyContent: 'center',
};

const hotKeys = (
  <div className="THotKeys">
    <div className="THotKeyRow">
      <div className="keyAlign"><span className="key">left</span></div>
      <div>move left</div>
    </div>
    <div className="THotKeyRow">
      <div className="keyAlign"><span className="key">right</span></div>
      <div>move right</div>
    </div>
    <div className="THotKeyRow">
      <div className="keyAlign"><span className="key">up</span></div>
      <div>rotate 90 deg clockwise</div>
    </div>
    <div className="THotKeyRow">
      <div className="keyAlign"><span className="key">down</span></div>
      <div>move down</div>
    </div>
    <div className="THotKeyRow">
      <div className="keyAlign"><span className="key">space</span></div>
      <div>drop</div>
    </div>
    <div className="THotKeyRow">
      <div className="keyAlign"><span className="key">r</span></div>
      <div>restart</div>
    </div>
  </div>
);

// game consts
const GAMESTATE = {
  STOPPED: 0,
  RUNNING: 1,
};
const SCORING = {
  0: 0,
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};


// notes: vertical 22, horizontal 10
/*   x,y
    [0,0][1,0][2,0]..
    [0,1][1,1]
    [0,2]
    :
*/
// a block is: empty, colored, moving, or hidden

class Board extends Component {
  constructor(props) {
    super(props);
    this.onKeyDown = this.onKeyDown.bind(this);

    // fresh board
    this.initBoard = () => {
      return new Array(22).fill(0).map((b, i) => {
        const row = new Array(10).fill();
        for (let j = 0; j < 10; j++) {
          row[j] = { state: BLOCK.empty, color: undefined };
        }
        return row;
      })
    };
    // fresh game state
    this.initState = () => {
      const board = this.initBoard();
      return {
        board,
        oldBoard: board,
        piece: undefined, // undef piece triggers new piece init
        nextBlock: Blocks.getRandomBlock(),
        holdBlock: undefined,
        combo: 0,
        linesCleared: 0,
        score: 0,
        level: 0,
        actionHist: [],
        time: Date.now(),
        startTime: Date.now(),
      };
    }

    this.state = {
      // meta state
      blockStyle: this.computeBlockStyle(props.h, props.w),
      nextQueueStyle: this.computeNextQueueStyle(props.h, props.w),
      gameState: GAMESTATE.RUNNING,
      // game state
      ...this.initState(),
    };

    // nonrendering game state
    this.frameRate = FP.S60;
    this.gravityDelay = 800;
    this.actions = []; // action to be applied to state

    this.gameLoop = setInterval(this.loop.bind(this), this.frameRate);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ blockStyle: this.computeBlockStyle(nextProps.h, nextProps.w) });
  }

  componentDidMount() {
    window.addEventListener('keydown', this.onKeyDown);
  }

  componentWillUnMount() {
    window.removeEventListener('keydown', this.onKeyDown);
    clearInterval(this.gameLoop);
  }

  onKeyDown(e) {
    if (e.key === 'ArrowRight') {
      this.actions.push('right');
    } else if (e.key === 'ArrowLeft') {
      this.actions.push('left');
    } else if (e.key === 'ArrowUp') {
      this.actions.push('rr');
    } else if (e.key === 'ArrowDown') {
      this.actions.push('down');
    } else if (e.key === ' ') {
      this.actions.push('drop');
    } else if (e.key === 'r') {
      this.setState({ ...this.initState(), gameState: GAMESTATE.RUNNING });
      this.actions = [];
      clearInterval(this.gameLoop);
      this.gameLoop = setInterval(this.loop.bind(this), this.frameRate);
    }
  }

  stopGame() {
    clearInterval(this.gameLoop);
    // TODO clear keyboard events handlers??
    this.setState({ gameState: GAMESTATE.STOPPED });
  }

  computeNextQueueStyle(h, w) {
    return {
      width: w * .5,
      height: h * 5 / 22,
      display: 'flex',
      justifyContent: 'center',
      flexDirection: 'column',
    };
  }

  computeBlockStyle(h, w) {
    // const unit = { height: h / 22, width: w / 10 };
    // const blockStyle = Object.assign(unit, blockBg);
    return { height: h / 22, width: w / 10 };
  }

  // pieceLocations is modified to contain where the piece parts exist on the board
  checkCollision(board, piece, pieceLocations) {
    const { shape, x, y } = piece;
    let collision = false;
    shape.forEach((row, i) => {
      if (collision) return;
      row.forEach((e, j) => {
        // if collision, no need to update piece. if e === 0, peice has no instance at that coord
        if (collision || e === 0) return;
        // check out of bounds
        if (y + i > 22 - 1 || x + j > 10 - 1 || x + j < 0) {
          // bottom, right, left out of bounds
          collision = true;
          return;
        } else if (y + i < 0) {
          // top out of bounds is okay
          return;
        }
        // get occupancy of board space
        const b = board[y + i][x + j];
        // check collision
        if (b.state === 1) {
          collision = true;
          return;
        }
        // reference to piece's location on the board
        pieceLocations.push(b);
      });
    });
    return collision;
  }

  // changes board and piece
  // returns null if collision, new board state if no collision
  insertPiece(board, piece) {
    const newLive = [];
    if (this.checkCollision(board, piece, newLive)) {
      // return null board, no board update
      return null;
    }

    // clean board state where piece was at
    this.cleanLive(piece);
    // update piece to new live location
    newLive.forEach(b => {
      // set board space to piece color
      b.backgroundColor = piece.backgroundColor;
      // set board space occupancy to active
      b.state = 2;
    });
    piece.live = newLive;
    // show downward projection of piece onto board
    this.projectPiece(board, piece);

    return { board, piece };
  }

  // changes board and piece, returns { board, piece }
  updatePiece(board, piece, transf, time) {
    const movement = {};

    // special cases
    // no transform, no op
    if (transf === undefined) {
      // no board update
      return null;
    }
    // moving down, caused by pressing down or gravity
    if (transf === 'down') {
      movement.lastDown = time;
      movement.y = piece.y + 1;
      // down triggers 'failed' which causes downstream effects
      return this.insertPiece(board, { ...piece, ...movement }) || 'failed';
    }
    // dropping transforms the projection into the piece
    if (transf === 'drop') {
      // note: lot of baaaad mutation
      // clean live and projection
      this.cleanLive(piece);
      // turn live into projection location w correct color
      piece.live = piece.projection.map(b => {
        b.state = 2;
        b.backgroundColor = piece.backgroundColor;
        return b;
      });
      return 'failed';
    }
    // rotations do wall kicks
    if (transf === 'rr') {
      movement.shape = rot90(piece.shape);
      let newState = this.insertPiece(board, { ...piece, ...movement });
      if (newState === null) {
        movement.x = piece.x + 1;
        newState = this.insertPiece(board, { ...piece, ...movement })
      }
      if (newState === null) {
        movement.x = piece.x - 1;
        newState = this.insertPiece(board, { ...piece, ...movement })
      }
      if (newState === null) {
        movement.x = piece.x - 2;
        newState = this.insertPiece(board, { ...piece, ...movement })
      }
      if (newState === null) {
        movement.x = piece.x + 2;
        newState = this.insertPiece(board, { ...piece, ...movement })
      }
      return newState;
    }

    // piece input movement
    if (transf === 'left') {
      movement.x = piece.x - 1;
    } else if (transf === 'right') {
      movement.x = piece.x + 1;
    }

    // reinstance piece to new location
    const newState = this.insertPiece(board, { ...piece, ...movement });
    return newState;
  }

  // places a projection of the piece to its drop location
  // changes board and piece
  projectPiece(board, piece) {
    let savedProjection = [];
    for (let i = piece.y; i < board.length; i++) {
      const projection = [];
      if (this.checkCollision(board, { ...piece, y: i }, projection)) {
        break;
      }
      // reset projection
      savedProjection = projection;
    }

    // projection coloring
    // set board space to piece color if space isnt occupied
    savedProjection.forEach(b => b.state === 0 && (b.backgroundColor = '#B8B8B8'));

    piece.projection = savedProjection;
  }

  // cements active pieces place on the board
  cementPiece(state) {
    // set state to part of the board
    state.piece.live.forEach(b => b.state = 1);
    // projections not in live get their color reset
    state.piece.projection.forEach(b => b.state === 0 && (b.backgroundColor = undefined));
    // remove active piece in state
    state.piece = undefined;
    return state;
    // return { ...state, piece: undefined }; // concerned about constantly creating objs
  }

  // removes filled lines and replace with 'cleared'
  removeLines(state) {
    state.board.forEach((row, i, board) => {
      if (row.reduce((isFilled, e) => (isFilled && e.state === BLOCK.filled), true)) {
        board[i] = null;
      }
    });
    return state;
  }

  shiftBoard(state) {
    // filter out nulls
    const board = state.board.filter(row => row);
    if (board.length === 22) {
      // no shifts needed
      state.combo = 0;
      return state;
    }

    const linesCleared = 22 - board.length;
    state.board = (new Array(linesCleared).fill(0).map(() => {
      const row = new Array(10).fill();
      for (let i = 0; i < 10; i++) {
        row[i] = { state: BLOCK.empty };
      }
      return row;
    })).concat(board);

    state.score += SCORING[linesCleared] + state.combo * state.level * 50;
    state.combo += 1;
    state.linesCleared += linesCleared;
    return state;
    // return { ...state, board }; // concerned about constantly creating objs
  }

  // changes board, wipes piece's existence off the board
  cleanLive(piece) {
    // reset live piece location on board
    piece.live.forEach(b => {
      b.backgroundColor = undefined;
      b.state = 0;
    });
    // reset projection location on board
    piece.projection.forEach(b => {
      b.backgroundColor = undefined;
    });
  }

  // sets down action if theres gravity
  checkGravity(time, piece, gravityDelay, actions) {
    let doGravity;
    if (GRAVITY_AFTER_DOWN) {
      doGravity = time - piece.lastDown > gravityDelay; // gravity after down
    } else {
      doGravity = time - piece.lastGravity > gravityDelay; // gravity after gravity
    }
    if (doGravity) {
      actions.unshift('down');
      piece.lastGravity = time;
    } 
  }

  initPiece(p, time) {
    if (p.name === 'O') { // 'O' get special treatment
      p.x = 4;
      p.y = -1;
    } else {
      p.x = 3;
      p.y = -1;
    }
    p.live = []; // ref to which elements on the board the piece is on
    p.projection = []; // ref to which elements on the board the projection is on
    p.lastGravity = time; // last time gravity was applied
    p.lastDown = time; // last time a down action was applied
    p.rotation = 0; // 1 == 90, 2 == 180, 3 == 270, cw rotation
    return p;
  }

  loop() {
    // if (Date.now() - this.state.time < this.frameRate) return; // do while loop limiter
    // const time = this.state.time + this.frameRate; // strict maintain
    const time = Date.now() // loose maintain
    if (TIMEUPDATE_ON) {
      this.setState({ time });
    }
    if (!this.state.piece) {
      // if no piece, instantiate and initialize piece
      const p = this.initPiece(this.state.nextBlock, time);
      const newState = this.insertPiece(this.state.board, p);
      if (newState === null) {
        console.log('game over');
        // game over
        this.stopGame();
      } else {
        // set state for new piece
        newState.nextBlock =  Blocks.getRandomBlock();
        newState.oldBoard = newState.board; // no change (for animations)
        this.setState(newState);
      }
    } else {
      const { level, piece, board, actionHist } = this.state;
      // maybe update block position from gravity
      if (GRAVITY_ON) {
        this.checkGravity(time, piece, LevelGravity[level] * this.gravityDelay, this.actions);
      }
      const transform = this.actions.shift();
      const newState = this.updatePiece(board, piece, transform, time);
      if (newState === null) {
        // no op
      } else if (newState === 'failed') {
        // gravity move position failed
        console.log('move position failed')
        // state chaining
        const oldBoard = cloneDeep(board);
        const actualState = app(this.state, this.cementPiece, this.removeLines, this.shiftBoard);
        actualState.oldBoard = oldBoard;
        this.setState(actualState); 
      } else {
        // successful move
        actionHist.push(transform);
        newState.oldBoard = newState.board; // no change (for animations)
        this.setState(newState);
      }
    }
  }

  renderBlock(block, blockStyle) {
    const blockRender = block.shape.map((row, i) => {
      if (!row.includes(1)) return;
      const rowRender = row.map((e, j) => {
        const key = `${block.name}-${i}-${j}`;
        if (e === 1) {
          // if block is occupied, give it its color
          return <div key={key} className="TBlock" style={{ ...blockStyle, backgroundColor: block.backgroundColor }}></div>;
        }
        // otherwise render empty block
        return <div key={key} style={blockStyle}></div>;
      });
      return <div key={`${block.name}-${i}`} className="TRow" style={TNextRowStyle}>{rowRender}</div>;
    });
    return <div>{blockRender}</div>;
  }

  renderBoardRow(row, oldRow, i, blockStyle) {
    return row.map((e, j) => {
      const key = `board-${i}-${j}`;
      if (e.backgroundColor) {
        // if block is occupied, give it its color
        return <div key={key} className="TBlock" style={{ ...blockStyle, backgroundColor: e.backgroundColor }}></div>;
      }
      // otherwise render empty block
      return <div key={key} className="TBlock" style={blockStyle}></div>;
    });
  }
  // renderBoardRow(row, oldRow, i, blockStyle) {
  //   return row.map((e, j) => {
  //     console.log(j, oldRow[j].backgroundColor, e.backgroundColor);
  //     return (<Spring
  //       from={{ backgroundColor: oldRow[j].backgroundColor }}
  //       to={{ backgroundColor: e.backgroundColor }}
  //       config={config.default}
  //     >
  //       {props => (
  //         <div key={`board-${i}-${j}`} className="TBlock" style={{ ...blockStyle, backgroundColor: props.backgroundColor }} />
  //       )}
  //     </Spring>);
  //     // <div key={`board-${i}-${j}`} className="TBlock" style={{ ...blockStyle, backgroundColor: e.backgroundColor }} />
  //   });
  // }

  // renderBoard(board, blockStyle) {
  //   return board.map((row, i) =>
  //     <div key={`board-${i}`} className="TRow" style={TRowStyle}>{this.renderBoardRow(row, i, blockStyle)}</div>
  //   );
  // }
  renderBoard(board, oldBoard, blockStyle) {
    return board.map((row, i) =>
      <div
        key={`board-${i}`}
        className="TRow"
        style={TRowStyle}
      >
        {this.renderBoardRow(row, oldBoard[i], i, blockStyle)}
      </div>
    );
  }

  render() {
    const areaRender = this.renderBoard(this.state.board, this.state.oldBoard, this.state.blockStyle);
    const nextQueueRender = this.renderBlock(this.state.nextBlock, this.state.blockStyle);
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="TSideBoard">
          <div className="TNextQueue" style={this.state.nextQueueStyle}>{nextQueueRender}</div>
        </div>
        <div className="TBoard">{areaRender}</div>
        <div className="TSideBoard">
          <div>Combo: {this.state.combo}</div>
          <div>Lines cleared: {this.state.linesCleared}</div>
          <div>Score: {this.state.score}</div>
          <div>Level: {this.state.level}</div>
          <div>Time: {((this.state.time - this.state.startTime) / 1000).toFixed(1)}s</div>
          { hotKeys }
        </div>
      </div>
    );
  }
}

Board.propTypes = {
  w: PropTypes.number.isRequired,
  h: PropTypes.number.isRequired,
  progressHandler: PropTypes.func,
};

export default Board;
