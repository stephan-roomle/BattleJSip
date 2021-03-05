import React, { Component, Fragment} from 'react';
import {
  getRandomBoardPosition,
  initializeOwnBoard,
  initializeEnemyBoard,
  isHit,
  placeShip,
  initializeBoard,
  STATE
} from './game/board-service';
import './App.css';

function getSequence(length) {
  return [
    ...Array.from({ length })
      .fill(0)
      .map((e, i) => i)
  ];
}

function getLetter(i) {
  return String.fromCharCode('A'.charCodeAt(0) + i);
}

function getNumberFromLetter(letter) {
  return letter.charCodeAt() - 65;
}

function getSquareCss(fleet, gameState, row, cell, isMyBoard) {
  const cellState = gameState[getLetter(cell) + row];
  let css = ' ';
  if (cellState === STATE.SHIP && isMyBoard) {
    css += 'is-ship';
  } else if (cellState === STATE.HIT) {
    css += 'hit';
  } else if (cellState === STATE.MISS) {
    css += 'water';
  } else if (cellState === STATE.SUNK) {
    css += 'sunk';
  }
  return css;
}

function getBorderCss(i, j) {
  const classNames = [];
  if (i === 0) {
    classNames.push('top');
  }
  if (j === 0) {
    classNames.push('left');
  }
  if (i === boardSize - 1) {
    classNames.push('bottom');
  }
  if (j === boardSize - 1) {
    classNames.push('right');
  }
  return classNames.join(' ');
}

function isGameFinished(gameState) {
  let sum = 0;
  Object.keys(gameState).forEach(key => {
    if ([STATE.SUNK, STATE.HIT].includes(gameState[key])) {
      sum++;
    }
  });
  return sum === 17;
}

const boardSize = 8;

const Board = ({fleet, gameState, selected, isMyBoard, forceUpdateHandler, isPlacement, updateText}) => {
  return (
    <div
      className={
        'board-container ' +
        (isMyBoard ? 'is-my-board' : '') +
        (isPlacement ? ' is-placement' : '')
      }
    >
      <div className="board-headline">{isMyBoard ? 'Your grid' : 'Opponents grid'}</div>
      <table className="board">
        <thead>
          <tr>
            <th />
            {getSequence(boardSize).map(i => (
              <th key={i}>{getLetter(i)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {getSequence(boardSize).map(i => (
            <tr key={i}>
              <td className="row">
                <strong>{i + 1}</strong>
              </td>
              {getSequence(boardSize).map(j => (
                <td
                  key={j}
                  className={
                    getBorderCss(i, j) +
                    ' ' +
                    getSquareCss(fleet, gameState, i, j, isMyBoard)
                  }
                >
                  <div className="square">
                    <div className={'square-content activated-cell'}>
                      <button onClick={() => ((isPlacement && !isMyBoard) ? updateText(`🚨 Can not place ships on your opponents board!! `) : ((!isMyBoard && !isPlacement) || (isPlacement && isMyBoard)) && forceUpdateHandler() && selected(getLetter(j) + i))}>
                        {getLetter(j) + i}
                      </button>
                    </div>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const DirectionSelector = ({selected}) => (
  <table>
    <tbody>
      <tr>
        <td />
        <td>
          <button onClick={() => selected('up')}>▲</button>
        </td>
        <td />
      </tr>
      <tr>
        <td>
          <button onClick={() => selected('left')}>◀</button>
        </td>
        <td />
        <td>
          <button onClick={() => selected('right')}>▶</button>
        </td>
      </tr>
      <tr>
        <td />
        <td>
          <button onClick={() => selected('down')}>▼</button>
        </td>
        <td />
      </tr>
    </tbody>
  </table>
);

const MessageBox = ({text}) => (
  <div className="message-box">{text}</div>
);
export default class App extends Component {
  constructor() {
    super();
    const urlParams = new URLSearchParams(window.location.search);
    const debug = urlParams.get('debug');
    this.state = {
      currentPosition: undefined,
      currentShipIndex: debug ? 10 : 0,
      enemyBoard: initializeEnemyBoard(),
      myBoard: debug ? initializeOwnBoard() : initializeBoard(),
      isFinished: false
    };
  }

  setCurrentPosition = position => {
    this.setState({
      currentPosition: position
    });
  };

  setText = text => {
    this.setState({
      ...this.state,
      text
    });
  };

  placeMyShip = direction => {
    const {myBoard, currentPosition, currentShipIndex} = this.state;

    if (currentPosition) {
      placeShip(myBoard, currentShipIndex, currentPosition, direction);

      this.setState({
        currentPosition: undefined,
        currentShipIndex: currentShipIndex + 1,
        myBoard
      });
    }
  };

  shoot = position => {
    if (this.state.isFinished) {
      return;
    }
    const enemyBoardState = this.state.enemyBoard.state[position];
    if (enemyBoardState && enemyBoardState !== STATE.SHIP) {
      this.setText(
        `You already shoot to this cell. Shoot somewhere else 💣`
      );
      return;
    }
    const pos = position[0] + '' + (parseInt(position[1], 10) + 1);
    this.setText(
      `Shoot at ${pos}: ${isHit(this.state.enemyBoard, position) ? 'Hit!' : 'Miss!'
      }`
    );
    const isForYouFinished = isGameFinished(this.state.enemyBoard.state);
    if (isForYouFinished) {
      this.setState({
        ...this.state,
        isFinished: isForYouFinished,
        text: `🎉 You won, congratulations 🎉`
      });
      return;
    }
    const counterAttack = getRandomBoardPosition(this.state.myBoard, 8, 8);
    const counterPos = counterAttack[0] + '' + (parseInt(counterAttack[1], 10) + 1);
    this.setText(
      `Enemy shoots at ${counterPos}: ${isHit(this.state.myBoard, counterAttack) ? 'Hit!' : 'Miss!'
      }`
    );
    const isGameForComputerFinished = isGameFinished(this.state.myBoard.state);
    if (isGameForComputerFinished) {
      this.setState({
        ...this.state,
        isFinished: isGameForComputerFinished,
        text: `🏴‍☠️ Opponent won! Try again 🏴‍☠️`
      });
      return;
    }
  };

  setStateToRender() {
    let num = this.state.num || 0;
    num++;
    this.setState({...this.state, num});
    return true;
  }

  render() {
    const {currentPosition, currentShipIndex, myBoard} = this.state;
    const ship = myBoard.fleet[currentShipIndex];
    let text;
    let useTextFromState = false;

    if (ship) {
      if (!!currentPosition) {
        text = `Select direction for ${ship.name}`;
      } else {
        text = `Select position for ${ship.name}`;
      }
      const suffix = !!this.state.text ? this.state.text : '';
      text = suffix + '' + text;
      this.state.text = null;
      useTextFromState = false;
    } else {
      text = `Shoot!`;
      useTextFromState = !!this.state.text ? true : false;
    }

    return (
      <Fragment>
        {!!currentPosition ? (
          <DirectionSelector selected={this.placeMyShip} />
        ) : (
            <div className="game-layout">
              <div>
                <div className="hidden">Ships</div>
              </div>
              <div>
                <Board forceUpdateHandler={() => this.setStateToRender()} isMyBoard={true} fleet={this.state.myBoard.fleet} gameState={this.state.myBoard.state} isPlacement={!!ship} selected={ship ? this.setCurrentPosition : this.shoot} updateText={this.setText} />
              </div>
              <div>
                <div>&nbsp;</div>
              </div>
              <div className="second-board">
                <Board forceUpdateHandler={() => this.setStateToRender()} isMyBoard={false} fleet={this.state.enemyBoard.fleet} gameState={this.state.enemyBoard.state} isPlacement={!!ship} selected={ship ? this.setCurrentPosition : this.shoot} updateText={this.setText} />
              </div>
              <div>
                <div className="hidden">Ships</div>
              </div>
              <div className="x">
                <div>
                  <MessageBox text={useTextFromState ? this.state.text : text} />
                </div>
                <div className={'interaction-buttons ' + (!this.state.isFinished ? 'hidden' : '')}>
                  <div onClick={() => window.location.reload()}>New Game</div>
                  <div onClick={() => window.location.reload()}>End Game</div>
                </div>
              </div>
            </div>
          )}
      </Fragment>
    );
  }
}
