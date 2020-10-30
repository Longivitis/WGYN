# WGYN Calculator
Author: Martin Nguyen

The script attached allows expressions submitted from competitors for WGYN B/C, which is a Science Olympiad Texas Trial Event, to be evaluated and automatically be determined if it is correct or incorrect. Useful for virtual tournaments, since competitors would be submtitting their answers electronically. Utilizes these [rules](https://drive.google.com/file/d/1UU-ypL8M4c8PEAAUXN0pAn0JBMH8gWpo/view) and formatting listed there.

Requires Google Forms (2 per division) and Google Sheets

![Sample Results](/images/WGYN_Example.PNG)

## Setup
It is ideal to have two Google Forms per division: one for the start time with the preliminary information and a second to display their answers and an end time. It is important for competitiors to re-enter their information on the second Google Form as well because there is a chance that one team would submit earlier than another, causing the rows to be shifted.

You would want three Google Sheets: two for the Google Forms and one to perform the results and calculations. You can combine form responses and the calculation sheet into one big Sheets file.

## Conditional Formatting and Additional Formulas
Conditional formatting needs to be set up so that the calculating the score would work. There is a rule for each of the three colors, which are green, yellow, and red. You would apply it to the whole range.

Green = `=AND(H2<>"", H2<>0)` Yellow = `Cell is empty` Red = `=H2<>H$1` where `H2` is the first team's answers and the start of the range and `H1` is where the number 1 would be.

Note that the red has absolute reference to the row since the top row would be the number the expression would want to result to and `<>` simply means equal.

You would also use `RANK` function to order the scores and determine placements. `MINUS` is also helpful in subtracting the form timers to see how long competitors took to submit their answers after they see it. You could format the times to display red if they go over a certain time limit.

What you would put into a cell if you want to determine the result would be `=solveFunction('C Answers'!E2, $F$1, H$1, "C")` where `E2` would be where the result is, `$F$1` is the set of numbers (from least to greatest) that they are using, `H$1` is the expected result, and `"C"` is the division. You can extend the range over the first set, but make sure to change `$F$1` when you get to the second set of numbers, wherever they may be located.

## Known Issues
- Since each cell is actually calling on the function, it results in a lot of lag if a bunch of results are called at the same time, having the potential to error out. It is best to have a duplicate sheet where it simply has the values and colors so that the results will not get lost. If you attempt to hard refresh the function, you would need a dummy parameter in order to do so, since Apps Script tends to cache the previous result in order to save time. In a similar vein, the total score will also display incorrectly until you force it to rerun, hence the dummy parameter in there.

- I didn't implement any tiebreakers. I simply counted how many times each team got 100/99... etc. right and manually broke them myself.

- Every time Google Forms records a response, it inserts a new row rather then replacing the last row (this is prevent data from being overwritten). This means that you would have to copy the formula row by row, which shouldn't be that difficult, but can be tedious. I tried to encase the function into an `ARRAYFORMULA` but it breaks the function since it actually doesn't recognize the expression as a "true" string, but more like an array. If it did recognize as a string, it wouldn't be able to recognize double digit numbers and rather note them down as single digits.
