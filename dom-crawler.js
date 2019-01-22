var docx = require('docx');

var findNodeByName = function(nodeIn, nodeNameIn) {

	// console.log('findNodeByName(): Finding next node named: ' + nodeNameIn);

	while( nodeIn.nodeName != nodeNameIn ) {
		
		if( !(nodeIn = getNextNode(nodeIn)) ) {
			return err('findNodeByName(): unable to find node named ' + nodeNameIn + '! (getNextNode threw err.)');
		}

	}

	// console.log('findNodeByName(): Footnote node found!: ' + nodeIn.nodeName);

	return nodeIn;
}

var getNextNode = function(nodeIn, endTag) {

	if(nodeIn.childNodes) { 

		return nodeIn.childNodes[0]; 

	} else if(nodeIn.nextSibling) {

		return nodeIn.nextSibling;

	} else {

		do {

			if ( nodeIn.parentNode ) {
				nodeIn = nodeIn.parentNode;
			} else {
				return err('getNextNode(): no more nodes!');
			}

			if ( nodeIn.nextSibling ) {
				if( nodeIn.nextSibling.nodeName == endTag ) {
					return err('getNextNode(): reached the limiting tag: ' + nodeIn.nextSibling.nodeName);
				}
				return nodeIn.nextSibling;
			} else {
				continue;
			}

		} while ( true );

	}

	return err('getNextNode(): somehow got out of search loop...');

}

var mapNode = function ( nodeIn, nodeHandler, datain ) { 

	var nodeIterator = nodeIn;
	var depth = 0;
	var skipnode = false;
	var i = 0;

	if ( !datain ) { 
		var data = { continue: true };
	} else {
		var data = datain;
		datain.continue = true;
	}

	data.maxdepth = 0;

	// Main explorer loop. Its task is to handle the current node (whether this means
	// outputting some information about it or building a document with it) and to
	// find the next node. It will continue until all nodes are handled.
	do {
		var exit = false;

		i++;
		// console.log('mapNode(): Iteration: ' + i + '; Node: ' + nodeIterator.nodeName);

		if ( data.maxdepth < depth ) data.maxdepth = depth;

		// Skip over all footnote nodes
		if( nodeIterator.nodeName != 'footnote' ) {

			// console.log('mapNode(): Not a footnote...');

			data = nodeHandler( nodeIterator, data, depth );

			// console.log('mapNode(): Node handled...');

			if ( !data.continue ) { return err('mapNode(): nodeHandler fcn error!'); }

			// Now that we've handled the node, let's go on to the node's first child.
			// If we can do that, continue on to the beginning of the main loop to handle
			// that child. Otherwise, we'll proceed below to try to go on to the next
			// sibling.
			if( nodeIterator.childNodes) {
				// console.log('mapNode(): Descending to childNodes[0]...');
				nodeIterator = nodeIterator.childNodes[0];
				depth++;
				continue;
			} 

		}

		// If the above was skipped (because we're in a footnote node) OR if there
		// are not childnodes to go to, we'll want to move on to the next sibling.
		// If we are able to do that, we can just continue on to the next iteration.
		if ( nodeIterator.nextSibling ) {
			// console.log('mapNode(): Going on to nextSibling...');
			nodeIterator = nodeIterator.nextSibling;
			continue;
		}

		// console.log('mapNode(): climbing back up...');
		// If you can't go down to the next child, or over to the next sibling, find
		// your way back up to the next available ancestor sibling
		do {

			// Go up to the parent unless we are at a depth of zero, this means we are 
			// at the end! (Note that we test depth and not the existence of a parent
			// so that we can use this function to explore subsections of a DOM object.)
			// If we are done, break the loop and exit(=true) the main loop.
			if ( depth != 0 ) {
				// console.log('mapNode(): going up to parentNode...');
				nodeIterator = nodeIterator.parentNode;
				depth--;
			} else {
				// console.log('mapNode(): no parentNode to climb to. Finished!');
				exit = true;
				break;
			}

			// Once we go up, go to the next sibling. If there's one to go to, we can
			// break out of this loop and continue (exit = false) the main loop. No 
			// sibling means we have to go up to the next parent again (which means 
			// continue this loop). 
			if ( nodeIterator.nextSibling ) {
				// console.log('mapNode(): Found the next unexplored sibling!');
				nodeIterator = nodeIterator.nextSibling;
				break;
			} else {
				continue;
			}

		} while ( true );

	} while ( !exit );

	data.maxdepth = depth;

	return data;

}

module.exports.mapNode = mapNode;
module.exports.getNextNode = getNextNode;
module.exports.findNodeByName = findNodeByName;
