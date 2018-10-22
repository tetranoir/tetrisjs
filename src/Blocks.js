const L = [
  [0, 0, 1],
  [1, 1, 1],
  [0, 0, 0],
];

const J = [
  [1, 0, 0],
  [1, 1, 1],
  [0, 0, 0],
];

const I = [
  [0, 0, 0, 0],
  [1, 1, 1, 1],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];

const O = [
  [1, 1],
  [1, 1],
];

const S = [
  [0, 1, 1],
  [1, 1, 0],
  [0, 0, 0],
];

const Z = [
  [1, 1, 0],
  [0, 1, 1],
  [0, 0, 0],
];

const T = [
  [0, 1, 0],
  [1, 1, 1],
  [0, 0, 0],
];

const colorsAry = ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff', '#ecd1c4', '#f2a2e8'];
// const colorsAry = ['#022FA8', '#FABB00', '#0202AF', '#EA002A', '#9400A3', '#008699', '#FA7800'];

export const Shapes = { L, J, I, O, S, Z, T };

const shapeList = Object.keys(Shapes);

export const Colors = shapeList.reduce((acc, val, i) => {
  acc[val] = colorsAry[i];
  return acc;
}, {});

const objs = shapeList.reduce((acc, val) => {
  acc[val] = { name: val, shape: Shapes[val], color: Colors[val] };
  return acc;
}, {});

export const getRandomBlock = () => {
  var block = Object.assign({}, objs[shapeList[Math.floor(Math.random() * shapeList.length)]])
  return block;
};

export const Blocks = Object.assign({ Shapes, Colors, getRandomBlock }, objs);

export default Blocks;
