

var skipCounts = {}

exports.record = function(probeName, skipCount){
	var skip = 1
	if(skipCount !== undefined){
		var sc = skipCounts[probeName]
		if(sc === undefined){
			sc = skipCounts[probeName] = 1
		}else{
			++skipCounts[probeName]
			if(sc === skipCount){
				skipCounts[probeName] = 0
				skip = skipCount
			}else{
				return
			}
		}
	}
	var stack = new Error().stack
	var parsed = parseStack(stack, skip)
	saveParsedStack(probeName, parsed)
	
	/*if(Math.random() < .01){
		exports.writeReport(Math.random()+'')
	}*/
}

/*exports.report = function(){
	
}*/

function parseStack(stack, skip){
	var lines = stack.split('\n')
	//throw new Error(JSON.stringify(lines))
	var parsed = []
	for(var i=1;i<lines.length;++i){//start at 1 to skip the "Error" line
		var line = lines[i]
		//console.log('*line: ' + line)
		line = line.substr(line.indexOf('at')+3)//skip the "at "
		//console.log('line: ' + line)
		var spaceIndex = line.indexOf(' ')
		var methodName = line.substr(0, spaceIndex)
		var filePos = line.substring(spaceIndex+2, line.length-1)
		var p = {method: methodName, line: filePos, skip: skip}
		//console.log('p: ' + JSON.stringify(p))
		parsed.push(p)
	}
	//throw new Error(JSON.stringify(parsed))
	return parsed
}

var saved = {}
function saveParsedStack(probeName, parsed){
	if(!saved[probeName]){
		saved[probeName] = []
	}
	saved[probeName].push(parsed)
}

function jsonReport(){
	var report = []
	var keys = Object.keys(saved)
	for(var i=0;i<keys.length;++i){
		var key = keys[i]
		var stacks = saved[key]
		var probe = {name: key, parents: {}, line: '-', count: 0}
		stacks.forEach(function(s){
			var cur = probe.parents
			s.forEach(function(line){
				var node = cur[line.line]
				if(!node){
					node = cur[line.line] = {name: line.method, line: line.line, parents: {}, count: 0}
				}
				node.count += line.skip
				//probe.count += line.skip
				cur = node.parents
			})
		})
		//console.log(JSON.stringify(root))
		report.push(probe)
	}
	return report
}

function recursivelyHtmlReport(tree, depth){
	var html = ''
	html += '<span>' + tree.count + ' ' + tree.name + ' ' + tree.line + '</span>'
	html += '<ul>'
	var parts = []
	Object.keys(tree.parents).forEach(function(parentKey){
		var parent = tree.parents[parentKey]
		var html = ''
		html += '<li'+ (depth % 10 === 0 ? ' class="hc"' : ' class="sc"') + '>'
		//console.log(JSON.stringify(parent))
		html += recursivelyHtmlReport(parent, depth+1)
		html += '</li>'
		parts.push({count: parent.count, html: html})
	})
	parts.sort(function(a,b){return b.count - a.count;})
	parts.forEach(function(p){
		html += p.html
	})
	html += '</ul>'
	return html
}
function htmlReport(){
	var json = jsonReport()
	var html = ''
	html += '<html><head><style>'
	html += 'li{list-style: none;display: none}'
	html += 'ul{padding-left: .5em}'
	html += 'span{white-space: nowrap}'
	html += 'li.sc {display: inherit}'
	html += 'li.hc > ul > li {display: none}'
	html += 'li.sc > ul > li {display: inherit}'
	html += 'div > ul > li {display: inherit}'
	html += '</style>'
	html += '<script>\n'
	html += 'document.addEventListener("DOMContentLoaded", function(){'
	html += 'var list = document.querySelectorAll("div > ul > li"); for(var i=0;i<list.length;++i){var n = list[i]; n.className = "sc"}'
	html += 'function liClickListener(e){'
	//html += 'if(e.target !== e.currentTarget) return;'
	html += 'console.log(e.currentTarget);'
	html += 'console.log(e.currentTarget.className);'
	html += 'if(e.currentTarget.className!=="sc"){e.currentTarget.className = "sc"}else{e.currentTarget.className = "hc"};'
	html += 'e.stopPropagation();'
	html += 'return true;'
	html += '}'
	html += 'var allLi = document.querySelectorAll("li");'
	html += 'for(var i=0;i<allLi.length;++i){'
	html += 'var li = allLi[i];li.addEventListener("click", liClickListener);'
	html += '}'
	html += '})'
	html += '\n</script>'
	html += '</head>'
	html += '<body>'
	//console.log('generating report')
	json.forEach(function(probe){
		//console.log('probe name(' + probe.name + ')')
		html += '<div>Probe: '// + probe.name
		html += recursivelyHtmlReport(probe, 0)
		html += '</div>'
	})
	//throw new Error(JSON.stringify(json))
	html += '</body></html>'
	return html
}
/*
var http = require('http');
http.createServer(function (req, res) {
	var html = htmlReport()
	//html = '<html><head><style>li{list-style: none}</style></head><body>'+html + '</body></html>'
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end(html);
}).listen(3478, '127.0.0.1');

console.log('stack-count server running at http://127.0.0.1:3478/');*/

var fs = require('fs')
process.on('exit', function() {
	fs.writeFileSync('stack_count.report.html', htmlReport())
})

exports.writeReport = function(prefix){
	if(!prefix) prefix = ''
	fs.writeFileSync(prefix+'stack_count.report.html', htmlReport())	
}
