
var stackCount = require('./../main.js')

function dummyA(){
	dummyB()
	dummyB()
}

function dummyB(){
	stackCount.record('b')
}

dummyA()
dummyB()
dummyA()

