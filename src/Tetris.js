import React, { Component } from 'react';

import Start from './Start';
import End from './End';
import Board from './Board';


class Tetris extends Component {
  constructor(props) {
    super(props);
    this.setSize = this.setSize.bind(this);
    this.setScreen = this.setScreen.bind(this);
    this.setScreen1 = this.setScreen.bind(1);
    this.setScreen2 = this.setScreen.bind(2);
    this.setScreen3 = this.setScreen.bind(3);

    this.state = {
      screen: 0,
      h: 0,
      w: 0,
    };
  }

  componentDidMount() {
    this.setSize();
    this.setState({screen: 2});
  }

  setScreen(screen) {
    this.setState({ screen });
  }

  setSize() { // ratio 10 x 22
    const width =  window.innerWidth;
    const height = window.innerHeight;
    let w = width;
    let h = height;
    if (width * 2.2 > height) {
      w = Math.floor(height / 2.2);
      // h = w * 2.2;
    } else {
      h = width * 2.2;
    }
    this.setState({ w, h });
  }

  render() {
    let app = 'tetris';
    if (this.state.screen === 1) {
      app = <Start progressHandler={this.setScreen2} />;
    } else if (this.state.screen === 2) {
      app = (
        <Board
          progressHandler={this.setScreen3}
          w={this.state.w}
          h={this.state.h}
        />
      );
    } else if (this.state.screen === 3) {
      app = <End progressHandler={this.setScreen1} />;
    }

    return <div style={{ height: this.state.h, width: this.state.w + 400, margin: 'auto' }}>{app}</div>;
  }
}

export default Tetris;
