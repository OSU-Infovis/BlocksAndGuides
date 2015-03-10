/*
* Blocks and Guidelines implementation
* Based on 
* @inproceedings{meyer2012four,
*   title={The four-level nested model revisited: blocks and guidelines},
*   author={Meyer, Miriah and Sedlmair, Michael and Munzner, Tamara},
*   booktitle={Proceedings of the 2012 BELIV Workshop: Beyond Time and Errors-Novel Evaluation Methods for Visualization},
*   pages={11},
*   year={2012},
*   organization={ACM}
* }
* Found at https://www.sci.utah.edu/publications/Mey2014a/Meyer_BELIV2014.pdf 
* as of Feb. 2015
* Last edit by Nels Oscar, 3/2/2015
*/
block = function(name, notes, contents){
    return new (function(){
        var self = this;
        self.name    = name;
        if(typeof(contents) != 'undefined')
            self.content = contents;
        else
            self.content = [];
        self.notes   = notes;

        return this;
    })();
};

getChildren = function rec (block){
    var result = []
    if(block.content.length > 0){
        for(var i in block.content){
            result.push(block.content[i]);
            result.concat(rec(block.content[i]));
        }
    }
    return result;
};

guideline = function(from, to, notes){
    return new (function(){
        this.from  = from;
        this.to    = to;
        this.notes = notes;
        return this;
    })();
};

bg_diagram = function(){
    return new (function(){
        this._domain_characterization = [ ];
        this._abstractions            = [ ];
        this._encodings               = [ ];
        this._algorithms              = [ ];
        this._guidelines              = [ ];
        var self                      = this;

        this.domain_characterization = function(name, note, content){
            self._domain_characterization.push(block(name, note, content));
            return self;
        };
        this.abstraction = function(name, note, content){
            self._abstractions.push(block(name, note, content));
            return self;
        };
        this.encoding = function(name, note, content){
            self._encodings.push(block(name, note, content));
            return self;
        };
        this.algorithm = function(name, note, content){
            self._algorithms.push(block(name, note, content));
            return self;
        };
        this.guideline = function(from, to, note){
            self._guidelines.push(guideline(from, to, note));
            return self;
        };
    })();
}