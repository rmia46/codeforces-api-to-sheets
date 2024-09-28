// global sheet variable to access the active sheet
const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

// function to fetch info using codeforces api
function didHeSolveIt(username, contestId, problemIndex) {
  // check if parameters are defined properly
  if(!username || !contestId || !problemIndex) {
    Logger.log("Invalid parameters in function didHeSolveIt");
    return "-";
  }

  // url fetcing
  const url = `https://codeforces.com/api/user.status?handle=${username}`;
  const response = UrlFetchApp.fetch(url);
  const data = JSON.parse(response.getContentText());
  // Uncomment line below to verbose the response data
  // Logger.log(JSON.stringify(data));

  // check if data received properly
  if(data.status === "OK") {
    // retrieving submission data
    const submissions = data.result;

    if(submissions.length === 0) {
      Logger.log(`User ${username} has not solved problem ${problemIndex} in contest ${contestId}`);
      return "-"; // user has not solved the problem
    }

    // looping through the submissions to check if user got verdict "AC"
    for(const submission of submissions) {
      if(submission.problem.contestId === contestId && submission.problem.index === problemIndex) {
        if(submission.verdict === "OK") {
          Logger.log(`User ${username} solved problem ${problemIndex} in contest ${contestId}`);
          return "AC";
          //return "✅"
        }
      }
    }

  }
  else {
    Logger.log("Error fetching data for user " + username);
    return "?"; // returning ? incase error in fetching data
  }
  Logger.log(`User ${username} has not solved problem ${problemIndex} in contest ${contestId}`);
  return "-"; // returning - for a user not solving a problem
}

// function to retrieve usrename from the sheet
function getSheetUsernames() {
  // setting the starting row and column to iterate through the cells
  const startRow = 5;
  const startCol = 3;
  const usernames = [];
  let currentCol = startCol;
  while(true) {
    const cellValue = sheet.getRange(startRow, currentCol).getValue();
    if(cellValue === "") 
      break; // stopping if encounter empty cell
    usernames.push(cellValue);
    currentCol++;
  }
  return usernames;
  //Logger.log(usernames);
}


// function to retrieve problem set from sheet
function getProblemUrls() {
  // Sheet Problems are starting from B6, which means col 2 and row 6
  const startRow = 6;
  const startCol = 2;
  const urls = [];
  // iterating though the column until empty cell found, in this case a null
  let currentRow = startRow;
  while(true) {
    // problems are rich text objects as they have embedded links, we are collecting the links here.
    const cellValue = sheet.getRange(currentRow, startCol).getRichTextValue().getLinkUrl();
    if(cellValue === null) {
      break;
    }
    urls.push(cellValue);
    currentRow++;
  } 
  // Logger.log(urls);
  return urls;
}

// function to fill cell with corresponding data
function fillCell(results, row, col) {
  let currentCol = col;
  for(const result of results) {
    const cell = sheet.getRange(row, currentCol);
    cell.setValue(result);
    if(result === "AC")
      cell.setBackground("#00ff00");
    if(result === "?")
      cell.setBackground("#fce5cd");
    
    currentCol++;
  }
  Logger.log("Wrote results " + results + " successfully!");
  // Logger.log("Successfully set values for row " + row + " and col " + col);
}

// function to process the links and retrieve user's status
function dataProcess(urls, usernames) {
  let row = 6, col = 3;
  for(const url of urls) {
    // checking link validity using regex
    Logger.log("Checking for url: " + url);
    const match = url.match(/contest\/(\d+)\/problem\/([A-Z])/);
    if(match) {
      const contestId = parseInt(match[1], 10);
      const problemIndex = match[2];
      // Logger.log("Detected contest with id " + contestId + " and " + problemIndex);

      const results = [];

      // retrieving results
      for(const username of usernames) {
        const result = didHeSolveIt(username, contestId, problemIndex);
        results.push(result);
      }
      Logger.log("Got results: " + results);
      fillCell(results, row, col);
      
    }
    else {
      Logger.log("Invalid Link"); // ignores the link if it's invalid
      continue;
    }
    row++; // going through rows, column is fixed for my sheet
  }
  
}

// Main function to drive all other functions
function main() {
  const usernames = getSheetUsernames();
  const urls = getProblemUrls();
  dataProcess(urls, usernames);
}
