

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

// 1 STEP
/// Reading compilerOptions from tsconfig.json.
const compilerOptions: ts.CompilerOptions =
  JSON.parse(fs.readFileSync('tsconfig.json').toString()).compilerOptions;
console.log(`\nCompiler options are:`, compilerOptions);

// 2 STEP
/// Calculating aliases replacements.
const paths = pathsToFolder(compilerOptions.paths, compilerOptions.outDir);
console.log(`\nOriginal paths are:`, compilerOptions.paths);
console.log(`Replacements paths are:`, paths);

// 3 STEP
/// Collecting all .js files from output folder.
const psJsFile: Array<string> = lsJsFiles(path.normalize(compilerOptions.outDir));
console.log(`\nList of .js files in output folder:`, psJsFile);


// 4 STEP
/// Replacing aliases in .js files content to relative paths.
/// As soon as our "paths" is relative to output folder (see STEP 2),
/// and "psJsFile" list of js file is also relative to output folder,
/// we may find relative path from one to another.
psJsFile.forEach(_sJsFile => {
  let sContent: string = fs.readFileSync(_sJsFile).toString();
  for (let sPathKey of Object.keys(paths)) {
    /// If alias found
    if (sContent.indexOf(sPathKey) >= 0) {
      /// Calculating replacement relative path.
      const sReplace: string =
        path.relative(path.dirname(_sJsFile), paths[sPathKey])
        // for Windows.
        .replace(/\\/g, '/');
      console.log(`\nFound "%s" in "%s"`, sPathKey, _sJsFile);
      console.log(`Relative path from js file folder "%s" to output folder "%s" is "%s"`,
        path.dirname(_sJsFile), paths[sPathKey], sReplace);
      console.log(`Replacing "%s" alias path to "%s" relative path`, sPathKey, sReplace);
      sContent = sContent.replace(new RegExp(sPathKey, 'g'), sReplace);
    }
  }
  fs.writeFileSync(_sJsFile, sContent);
});


/** Converts typescript compilerOptions paths to relative paths from output folder.
 * It just removes the trailing "/*" and adds output folder as prefix of the path.
 * For example:
 *   "@alias/*": [ "./functions/*" ]
 * converts to
 *   "@alias": "dst/functions"
 * @param _paths Original paths.
 * @param _outDir Output folder.
 */
function pathsToFolder(_paths: any, _outDir: string) {
  const mReturn = {};
  for (let sPathAlias of Object.keys(_paths)) {
    /// This is simple example, so it takes only [0] element for each alias.
    mReturn[path.dirname(sPathAlias)] =
      path.join(_outDir, path.dirname(_paths[sPathAlias][0]));
  }
  return mReturn;
}


/** Simple recursive function returns paths of .js files in folder.
 * @param _sFolder Folder where .js files are looking for.
 */
function lsJsFiles(_sFolder: string): Array<string> {
  let psReturn: Array<string> = [];
  fs.readdirSync(_sFolder).forEach(_sPath => {
    const sAbsPath: string = path.join(_sFolder, _sPath);
    if (fs.statSync(sAbsPath).isDirectory()) {
      psReturn = psReturn.concat(lsJsFiles(sAbsPath));
    } else if (path.extname(sAbsPath) === '.js') {
      psReturn.push(sAbsPath);
    }
  });
  return psReturn;
}

