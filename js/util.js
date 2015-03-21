// Extensions.
$.anyEq = function (a, b) {
    return $.map(a, function (n) {
        return $.inArray(n, b) > -1;
    }).reduce(function (c, d) {
        return c || d;
    });
}

remove = function (array, obj) {
    var i = array.indexOf(obj);
    if (i != -1) {
        array.splice(i, 1);
    }
};

// Check for a selector expression against a jquery object via polling.
function pollUntil($c) {
    return new(function(){
        var _pollingFreq = 100;
        var _done = function(){};
        var _waiting = function(){};
        var _predicate = function(){true};

        var self = this;
        self.running = false;

        // Helper function for non-blocking polling.
        function f() {
            if (!self.running) return;
            if (_predicate($c)) {
                _done($c);
            } else {
                _waiting($c);
                setTimeout(f, _pollingFreq); // or wait pollingFreq ms, then try again
            }
        };

        self.frequency = function (n) {
            if (typeof (n) != 'undefined'){ 
                pollingFreq = n;
                return self;
            }
            return pollingFreq;
        };

        self.predicate = function(c){
            _predicate = c;
            return self;
        }

        self.done = function(c){
            _done = c;
            return self;
        };

        self.waiting = function(c){
            _waiting = c;
            return self;
        };

        self.run = function () {
            self.running = true;
            f();
            return self;
        };
        self.stop = function () {
            self.running = false;
            return self;
        };
        return self;
    })();
}