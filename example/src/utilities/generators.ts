export function generatePlaneMesh(width: number, height: number, sizeX: number, sizeY: number){
    let cellSize = (1 / width);
    let positions = [];
    let normals = [];
    let texCoords = [];

    let vertices = 0;
    let uvs = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        //1------------------------------------FIRST-TRIANGLE
        positions[vertices + 0] = x * cellSize * sizeX;
        positions[vertices + 1] = y * cellSize * sizeY;
        positions[vertices + 2] = 0 * cellSize;
        normals[vertices + 0] = 0;
        normals[vertices + 1] = 0;
        normals[vertices + 2] = 1;
        texCoords[uvs + 0] = x / width;
        texCoords[uvs + 1] = 1 - y / height;
        //2
        positions[vertices + 3] = x * cellSize * sizeX;
        positions[vertices + 4] = (y + 1) * cellSize * sizeY;
        positions[vertices + 5] = 0 * cellSize;
        normals[vertices + 3] = 0;
        normals[vertices + 4] = 0;
        normals[vertices + 5] = 1;
        texCoords[uvs + 2] = x / width;
        texCoords[uvs + 3] = 1 - (y + 1) / height;
        //3
        positions[vertices + 6] = (x + 1) * cellSize * sizeX;
        positions[vertices + 7] = y * cellSize * sizeY;
        positions[vertices + 8] = 0 * cellSize;
        normals[vertices + 6] = 0;
        normals[vertices + 7] = 0;
        normals[vertices + 8] = 1;
        texCoords[uvs + 4] = (x + 1) / width;
        texCoords[uvs + 5] = 1 - y / height;
        //4------------------------------------SECOND-TRIANGLE
        positions[vertices + 9] = (x + 1) * cellSize * sizeX;
        positions[vertices + 10] = y * cellSize * sizeY;
        positions[vertices + 11] = 0 * cellSize;
        normals[vertices + 9] = 0;
        normals[vertices + 10] = 0;
        normals[vertices + 11] = 1;
        texCoords[uvs + 6] = (x + 1) / width;
        texCoords[uvs + 7] = 1 - y / height;
        //5
        positions[vertices + 12] = x * cellSize * sizeX;
        positions[vertices + 13] = (y + 1) * cellSize * sizeY;
        positions[vertices + 14] = 0 * cellSize;
        normals[vertices + 12] = 0;
        normals[vertices + 13] = 0;
        normals[vertices + 14] = 1;
        texCoords[uvs + 8] = x / width;
        texCoords[uvs + 9] = 1 - (y + 1) / height;
        //6
        positions[vertices + 15] = (x + 1) * cellSize * sizeX;
        positions[vertices + 16] = (y + 1) * cellSize * sizeY;
        positions[vertices + 17] = 0 * cellSize;
        normals[vertices + 15] = 0;
        normals[vertices + 16] = 0;
        normals[vertices + 17] = 1;
        texCoords[uvs + 10] = (x + 1) / width;
        texCoords[uvs + 11] = 1 - (y + 1) / height;

        vertices += 18;
        uvs += 12;
      }
    }

    return { positions: Float32Array.from(positions), normals: Float32Array.from(normals), texCoords: Float32Array.from(texCoords) };
  }