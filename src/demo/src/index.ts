// @ts-check

/** Import project dependencies */
import fs from 'fs';
import { promisify } from 'util';

/** Setting up */
const readFrom = promisify(fs.readFile);
const writeTo = promisify(fs.writeFile);
const srcFilePath = './test.json';
const distFilePath = './dist/test.json';

export async function remapJson() {
  const fileContent = await readFrom(srcFilePath, 'utf-8');
  const jsonContent = JSON.parse(fileContent);
  const remapped = jsonContent.test;

  return remapped;
}

export async function writeRemapped(content) {
  return writeTo(distFilePath, content);
}

export async function testObjectRestSpread(content) {
  return {
    ...content,
  };
}

export default remapJson;
