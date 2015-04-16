localStorageManager = new(function() {
    var self = this;

    self.put = function(key, value) {
        localStorage[key] = JSON.stringify(value);
        return self;
    }

    self.put_prefixed = function(prefix, key, value){
        localStorage[prefix+key] = JSON.stringify(value);
        return self;
    }

    self.get = function(key) {
        if (self.has_key(key))
            return JSON.parse(localStorage[key]);
        return null;
    }

    self.get_prefixed = function(prefix, key){
        return JSON.parse(localStorage[prefix+key]);
    }

    self.get_all_prefixed = function(prefix){
        var r = {};
        for(var i in localStorage){
            if(i.startsWith(prefix))
                try{
                    r[i.slice(prefix.length)] = JSON.parse(localStorage[i]);
                }catch(e){}
        }
        return r;
    }

    self.has_key = function(key){
        return localStorage.hasOwnProperty(key);
    }

    self.has_key_prefixed = function(prefix, key){
        return localStorage.hasOwnProperty(prefix+key);
    }

    self.remove_prefixed = function(prefix, key){
        item = localStorage[prefix+key];
        delete localStorage[prefix+key];
        return JSON.parse(item); 
    }

    return self;
})();