// fps constants
export const FP = {
  S60: 17,
  S30: 34,
  S24: 42,
};
// block states
export const BLOCK = {
  empty: 0,
  filled: 1,
};
// gravity %s from SNES framerates
export const LevelGravity = [
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
  .017, // 29
];
// snes level lines per level up
export const LevelUpLines = [
  10,
  20,
  30,
  40,
  50,
  60,
  70,
  80,
  90,
  100,
  100,
  100,
  100,
  100,
  100,
  100,
  110,
  120,
  130,
  140,
  150,
  160,
  170,
  180,
  190,
  200,
  200,
  200,
  200,
];
// snes total lines cleared per level
export const LevelLines = LevelUpLines.reduce(
  (totalLines, levelLine) => ([...totalLines, totalLines[totalLines.length - 1] + levelLine]),
  [0],
);
// snes max level
export const MAXLEVEL = 29;
// game states
export const GAMESTATE = {
  STOPPED: 0,
  RUNNING: 1,
};
// scoring per lines cleared
export const SCORING = {
  0: 0,
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};