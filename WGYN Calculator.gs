/* 
* We've Got Your Number Calculator
* Author: Martin Nguyen
*
* Automatically determines if equations provided from competitors for WGYN is valid
* given the set of numbers and the intended result. Requires Google Forms for set up
*
* infixToPostfix and solvePostfix functions taken from Nic Raboy from thepolyglotdeveloper.
* added factorials and logarithms within PEMDAS for application of Division C.
* does not calculate double factorials but rather a factorial of a factorial
*/

/* 
* calculateScore(): determines scores by adding or subtracting depending on cell background
* if green increment, if red decrement, yellow do nothing
* dummy parameter is used to force update when the cells have changed
* shouldn't be needed unless I screw up the calculations somehow or reloading the page
* calculates for one set of nums (1-100)
* cell should be where the answer 1 column result is located
* returns score for one set of nums
*/
function calculateScore(cell, dummy) {
  var currentCell = SpreadsheetApp.getActiveSpreadsheet().getRange(cell);
  var score = 0;
  
  for(var i = 0; i < 100; i++) {
    var backgroundColor = currentCell.getBackground();
    if(backgroundColor == "#b7e1cd")
      score++;
    else if(backgroundColor == "#f4c7c3")
      score--;
    currentCell = currentCell.offset(0, 1);
  }
  
  SpreadsheetApp.flush();
  
  return score;
}

/* 
* determine background color of the current cell
* helper method, can use on a specific cell to determine color
* result will appear on logger
* not actively used in scoring
*/
function detBackgroundColor(cell) {
  var currentCell = SpreadsheetApp.getActiveSpreadsheet().getRange(cell);
  return currentCell.getBackground();
}

/* 
* solveFunction()
* combines three methods to return either the number expected or a 0 if incorrect
* if the function is blank, returns a blank so no penalty is incurred in scoring
*/
function solveFunction(equation, numbers, target, division) {
  if(equation == "") {
    return "";
  }
  var isNums = validateNumbers(equation, numbers);
  var postfix = infixToPostfix(isNums, division);
  var solution = solvePostfix(postfix, target);
  return solution;
}

/* 
* same as solveFunction(), google sheets can be annoying with cache if
* function breaks midway through processing, have to hard refresh it with this
*/
function solveFunction2(equation, numbers, target, division) {
  if(equation == "") {
    return "";
  }
  var isNums = validateNumbers(equation, numbers);
  var postfix = infixToPostfix(isNums, division);
  var solution = solvePostfix(postfix, target);
  return solution;
}

/*
* validateNumbers(): looks at numbers used in the equation and
* make sure there are four numbers and they are the correct four numbers
* otherwise return error, sorts the four numbers from least to greatest
* if error, returns 0 meaning incorrect in solveFunction()
* pulls only numbers from the array and sorts them
*/
function validateNumbers(equation, numbers) {
  var oldequation = equation;
  var usedNumbers = "";
  equation = equation.replace(/\s+/g, "");
  equation = equation.split(/([\+\-\*\x\X\!\/\^\L\(\)])/).clean();
  for(var i = 0; i < equation.length; i++) {
    var token = equation[i];
    if(token.isNumeric()) {
      usedNumbers += token;
    }
  }
  var numbersArray = [];
  for(i = 0; i < usedNumbers.length; i++) {
    numbersArray.push(parseInt(usedNumbers.substring(i, i+1)));
  }
  numbersArray.sort();
  usedNumbers = "";
  for(i = 0; i < numbersArray.length; i++) {
    token = numbersArray[i];
    usedNumbers += token;
  }  
  if(parseInt(usedNumbers) == numbers) {
    return oldequation;
  } else {
    return 0;
  }
}

// is this numeric? since expression is not necessarily a string
// function taken from Nic Raboy from thepolyglotdeveloper.
String.prototype.isNumeric = function() {
    return !isNaN(parseFloat(this)) && isFinite(this);
}

// splices depending on parameteres given in the function
// function taken from Nic Raboy from thepolyglotdeveloper.
Array.prototype.clean = function() {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === "") {
            this.splice(i, 1);
        }
    }
    return this;
}

/*
* infixToPostfix(): converts infix expression to postfix expression
* associativity means how to process when same operands are in a row
* utilizes a stack to push/pop arguments as necessary
* there is some cleanup at the end to make sure it doesn't end with a space
* or else the solvePostfix() function will break for some reason
* division parameter is to check which functions are valid since
* division B can't use logs or factorials
* if they do use it, the number associated with the operand will disappear,
* effectively giving the incorrect result
*/
function infixToPostfix(infix, division) {
  if(infix == 0) {
    return 0;
  }
  var outputQueue = "";
  var operatorStack = [];
  //parenthesis, factorials, exponents/logarithms, mult/divis, add/sub
  var operators = {
    "!": {
      precedence: 5,
      associativity: "Left"
    },
    "^": {
      precedence: 4,
      associativity: "Right"
    },
    "L": {
      precedence: 4,
      associativity: "Right"
    },
    "/": {
      precedence: 3,
      associativity: "Left"
    },
    "*": {
      precedence: 3,
      associativity: "Left"
    },
    "x": {
      precedence: 3,
      associativity: "Left"
    },
    "X": {
      precedence: 3,
      associativity: "Left"
    },
    "+": {
      precedence: 2,
      associativity: "Left"
    },
    "-": {
      precedence: 2,
      associativity: "Left"
    }
  }
  infix = infix.replace(/\s+/g, "");
  if(division == "C") {
    infix = infix.split(/([\+\-\*\x\X\!\/\^\L\(\)])/).clean();
  } else {
    infix = infix.split(/([\+\-\*\x\X\/\^\(\)])/).clean();
  }
  for(var i = 0; i < infix.length; i++) {
    var token = infix[i];
    if(token.isNumeric()) {
      outputQueue += token + " ";
    } else if(division == "C" && "^*/+-xX!L".indexOf(token) !== -1) {
      var o1 = token;
      var o2 = operatorStack[operatorStack.length - 1];
      while("^*/+-xX!L".indexOf(o2) !== -1 && ((operators[o1].associativity === "Left" 
            && operators[o1].precedence <= operators[o2].precedence) || (operators[o1].associativity === "Right" 
                                                                         && operators[o1].precedence < operators[o2].precedence))) {
        outputQueue += operatorStack.pop() + " ";
        o2 = operatorStack[operatorStack.length - 1];
      }
      operatorStack.push(o1);
    } else if(division == "B" && "^*/+-xX".indexOf(token) !== -1) {
      var o1 = token;
      var o2 = operatorStack[operatorStack.length - 1];
      while("^*/+-xX".indexOf(o2) !== -1 && ((operators[o1].associativity === "Left" 
            && operators[o1].precedence <= operators[o2].precedence) || (operators[o1].associativity === "Right" 
                                                                         && operators[o1].precedence < operators[o2].precedence))) {
        outputQueue += operatorStack.pop() + " ";
        o2 = operatorStack[operatorStack.length - 1];
      }
      operatorStack.push(o1);      
    } else if(token === "(") {
      operatorStack.push(token);
    } else if(token === ")") {
      while(operatorStack[operatorStack.length - 1] !== "(") {
        outputQueue += operatorStack.pop() + " ";
      }
      operatorStack.pop();
    }
  }
  while(operatorStack.length > 1) {
    outputQueue += operatorStack.pop() + " ";
  }
  //prevents ending the outputQueue with a space, which would break solvePostfix()
  if(operatorStack.length == 1) {
    outputQueue += operatorStack.pop();
  }
  if(outputQueue.endsWith(" ")) {
    outputQueue = outputQueue.slice(0, -1); 
  }
  return outputQueue;
}

/*
* solvePostfix(): solves the postfix equation and determines if it is equal to the target
* pushes tokens into the stack one at a time, if an operand is encountered, pop
* the last two (or one) operands and calculate, then push the result in
* if function is correct, there should only be one number at the end, which is the result
* if it is the same as the target, return the result; if not, return 0, signifying it is incorrect
* must use parseFloat or else division will not result in fractions
*/
function solvePostfix(postfix, target) {
  if(postfix == 0) {
    return 0;
  }
  var resultStack = [];
  postfix = postfix.split(" ");
  for(var i = 0; i < postfix.length; i++) {
    if(postfix[i].isNumeric()) {
      resultStack.push(postfix[i]);
    } else {
      var a = resultStack.pop();
      //factorials only require one number, not two
      if(postfix[i] === "!") {
        resultStack.push(parseFloat(factorial(a)));
      }
      else {
        var b = resultStack.pop();
        if(postfix[i] === "+") {
          resultStack.push(parseFloat(a) + parseFloat(b));
        } else if(postfix[i] === "-") {
          resultStack.push(parseFloat(b) - parseFloat(a));
        } else if(postfix[i] === "*" || postfix[i] === "x" || postfix[i] === "X") {
          resultStack.push(parseFloat(a) * parseFloat(b));
        } else if(postfix[i] === "/") {
          resultStack.push(parseFloat(parseFloat(b) / parseFloat(a)));
        } else if(postfix[i] === "^") {
          resultStack.push(Math.pow(parseFloat(b), parseFloat(a)));
        } else if(postfix[i] === "L") {
          resultStack.push(Math.log(a) / Math.log(b));
        }
      }
    }
  }
  if(resultStack.length > 1) {
    return 0;
  } else {
    var num = resultStack.pop();
    if(num == target)
      return num;
    else
      return 0;
  }
}

//returns factorial of num
function factorial(num) {
  var result = num;
  if (num === 0 || num === 1) 
    return 1; 
  while (num > 1) { 
    num--;
    result *= num;
  }
  return result;
}