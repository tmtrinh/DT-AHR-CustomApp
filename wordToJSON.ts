import * as fs from 'fs';
import * as mammoth from 'mammoth';
/*
** This function coverts docx files to JSON object
**Requirements:
  * npm install mammoth
  * npm install mammoth fs
  * npm install @types/fs-extra @types/jsdom
*/
async function convertWordToJSON(inputFilePath: string, outputFilePath: string) {
  try {
    //converts word doc to raw text
    const result = await mammoth.extractRawText({ path: inputFilePath });
    const paragraphs = result.value.split('\n').filter((paragraph) => paragraph.trim() !== '');

    // json array - gets maps each line in raw text to a sinlge json object
    const jsonArray = paragraphs.map((line) => ({ question: line }));

    // write the results to an JSON output file
    fs.writeFileSync(outputFilePath, JSON.stringify(jsonArray, null, 2));
    console.log(`Successfully converted Word document to JSON. Output written to ${outputFilePath}`);
  } catch (error) {
    console.error('Error converting Word document:', error);
  }
}

// specify the inputFilePath where .docx file is located
const inputFilePath = 'questions.docx';

// specify the output file path
const outputFilePath = 'output.json';

convertWordToJSON(inputFilePath, outputFilePath);
