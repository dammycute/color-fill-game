export const COLORS = [
  '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C',
  '#F1C40F', '#E67E22', '#D35400', '#C0392B', '#8E44AD', '#2980B9',
  '#27AE60', '#16A085', '#2C3E50', '#7F8C8D', '#FF5252', '#FF4081',
  '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF',
  '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740',
  '#FFAB40', '#FF6E40'
]

export const LEVELS = [
  { grid: 6, maxMoves: 8, colors: 4 },
  { grid: 7, maxMoves: 10, colors: 4 },
  { grid: 8, maxMoves: 12, colors: 5 },
  { grid: 9, maxMoves: 15, colors: 5 },
  { grid: 10, maxMoves: 18, colors: 6 },
  { grid: 11, maxMoves: 20, colors: 6 },
  { grid: 12, maxMoves: 23, colors: 6 },
  { grid: 13, maxMoves: 26, colors: 7 },
  { grid: 14, maxMoves: 29, colors: 7 },
  { grid: 15, maxMoves: 32, colors: 7 },
  // { grid: 16, maxMoves: 36, colors: 8 },
  // { grid: 17, maxMoves: 39, colors: 8 },
  // { grid: 18, maxMoves: 42, colors: 8 },
  // { grid: 19, maxMoves: 45, colors: 8 },
  // { grid: 20, maxMoves: 48, colors: 9 },
  // { grid: 21, maxMoves: 51, colors: 9 },
  // { grid: 22, maxMoves: 54, colors: 9 },
  // { grid: 23, maxMoves: 57, colors: 9 },
  // { grid: 24, maxMoves: 60, colors: 10 },
  // { grid: 25, maxMoves: 63, colors: 10 },
  // { grid: 26, maxMoves: 66, colors: 10 },
  // { grid: 27, maxMoves: 69, colors: 10 },
  // { grid: 28, maxMoves: 72, colors: 11 },
  // { grid: 29, maxMoves: 75, colors: 11 },
  // { grid: 30, maxMoves: 78, colors: 11 },
  // { grid: 31, maxMoves: 81, colors: 11 },
  // { grid: 32, maxMoves: 84, colors: 12 },
  // { grid: 33, maxMoves: 87, colors: 12 },
  // { grid: 34, maxMoves: 90, colors: 12 },
  // { grid: 35, maxMoves: 93, colors: 12 },
  // { grid: 36, maxMoves: 96, colors: 13 },
  // { grid: 37, maxMoves: 99, colors: 13 },
  // { grid: 38, maxMoves: 102, colors: 13 },
  // { grid: 39, maxMoves: 105, colors: 13 },
  // { grid: 40, maxMoves: 108, colors: 14 },
  // { grid: 41, maxMoves: 111, colors: 14 },
  // { grid: 42, maxMoves: 114, colors: 14 },
  // { grid: 43, maxMoves: 117, colors: 14 },
  // { grid: 44, maxMoves: 120, colors: 15 },
  // { grid: 45, maxMoves: 123, colors: 15 },
  // { grid: 46, maxMoves: 126, colors: 15 },
  // { grid: 47, maxMoves: 129, colors: 15 },
  // { grid: 48, maxMoves: 132, colors: 16 },
  // { grid: 49, maxMoves: 135, colors: 16 },
  // { grid: 50, maxMoves: 138, colors: 16 },
  // { grid: 51, maxMoves: 141, colors: 16 },
  // { grid: 52, maxMoves: 144, colors: 17 },
  // { grid: 53, maxMoves: 147, colors: 17 },
  // { grid: 54, maxMoves: 150, colors: 17 },
  // { grid: 55, maxMoves: 153, colors: 17 },
  // { grid: 56, maxMoves: 156, colors: 18 },
  // { grid: 57, maxMoves: 159, colors: 18 },
  // { grid: 58, maxMoves: 162, colors: 18 },
  // { grid: 59, maxMoves: 165, colors: 18 },
  // { grid: 60, maxMoves: 168, colors: 19 },
  // { grid: 61, maxMoves: 171, colors: 19 },
  // { grid: 62, maxMoves: 174, colors: 19 },
  // { grid: 63, maxMoves: 177, colors: 19 },
  // { grid: 64, maxMoves: 180, colors: 20 },
  // { grid: 65, maxMoves: 183, colors: 20 },
  // { grid: 66, maxMoves: 186, colors: 20 },
  // { grid: 67, maxMoves: 189, colors: 20 },
  // { grid: 68, maxMoves: 192, colors: 21 },
  // { grid: 69, maxMoves: 195, colors: 21 },
  // { grid: 70, maxMoves: 198, colors: 21 },
  // { grid: 71, maxMoves: 201, colors: 21 },
  // { grid: 72, maxMoves: 204, colors: 22 },
  // { grid: 73, maxMoves: 207, colors: 22 },
  // { grid: 74, maxMoves: 210, colors: 22 },
  // { grid: 75, maxMoves: 213, colors: 22 },
  // { grid: 76, maxMoves: 216, colors: 23 },
  // { grid: 77, maxMoves: 219, colors: 23 },
  // { grid: 78, maxMoves: 222, colors: 23 },
  // { grid: 79, maxMoves: 225, colors: 23 },
  // { grid: 80, maxMoves: 228, colors: 24 },
  // { grid: 81, maxMoves: 231, colors: 24 },
  // { grid: 82, maxMoves: 234, colors: 24 },
  // { grid: 83, maxMoves: 237, colors: 24 },
  // { grid: 84, maxMoves: 240, colors: 25 },
  // { grid: 85, maxMoves: 243, colors: 25 },
  // { grid: 86, maxMoves: 246, colors: 25 },
  // { grid: 87, maxMoves: 249, colors: 25 },
  // { grid: 88, maxMoves: 252, colors: 26 },
  // { grid: 89, maxMoves: 255, colors: 26 },
  // { grid: 90, maxMoves: 258, colors: 26 },
  // { grid: 91, maxMoves: 261, colors: 26 },
  // { grid: 92, maxMoves: 264, colors: 27 },
  // { grid: 93, maxMoves: 267, colors: 27 },
  // { grid: 94, maxMoves: 270, colors: 27 },
  // { grid: 95, maxMoves: 273, colors: 27 },
  // { grid: 96, maxMoves: 276, colors: 28 },
  // { grid: 97, maxMoves: 279, colors: 28 },
  // { grid: 98, maxMoves: 282, colors: 28 },
  // { grid: 99, maxMoves: 285, colors: 28 },
  // { grid: 100, maxMoves: 288, colors: 29 },
  // { grid: 101, maxMoves: 291, colors: 29 },
]

export function generateGrid(size, numColors, seed) {
  let rng = Math.random
  if (seed) {
    let s = 0
    for (let i = 0; i < seed.toString().length; i++) {
      s = (s << 5) - s + seed.toString().charCodeAt(i)
    }
    rng = () => {
      s = (s * 16807) % 2147483647
      return (s - 1) / 2147483646
    }
  }

  const grid = Array.from({ length: size }, () => Array(size).fill(0))
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let color
      // 10% chance to inherit from neighbor for slightly easier solving (clumping)
      if (r > 0 && rng() < 0.10) {
        color = grid[r - 1][c]
      } else if (c > 0 && rng() < 0.05) {
        color = grid[r][c - 1]
      } else {
        color = Math.floor(rng() * numColors)
      }
      grid[r][c] = color
    }
  }
  return grid
}

export function floodFill(grid, row, col, oldColor, newColor) {
  const size = grid.length
  const stack = [[row, col]]
  const visited = new Set()
  while (stack.length) {
    const [r, c] = stack.pop()
    const key = `${r},${c}`
    if (r < 0 || r >= size || c < 0 || c >= size) continue
    if (visited.has(key)) continue
    if (grid[r][c] !== oldColor) continue
    visited.add(key)
    grid[r][c] = newColor
    stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1])
  }
}

export function isBoardFilled(grid) {
  const target = grid[0][0]
  return grid.every(row => row.every(cell => cell === target))
}

export function deepCopy(grid) {
  return grid.map(row => [...row])
}

export function calcStars(moves, maxMoves) {
  if (moves <= Math.floor(maxMoves * 0.5)) return 3
  if (moves <= Math.floor(maxMoves * 0.75)) return 2
  return 1
}

export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}
