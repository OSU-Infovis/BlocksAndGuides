activeDoc = '';
var guideTable = {};  //RAM: This probably should not be global

// Utility functions - Nels will refactor these out
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

//Render the 'menu' area
renderDocs = function(){
    $('#saves').empty();
    for(var i in localStorage){
        (function(name){
            var item = $("<li>"+name+"</li>");
            if(name == activeDoc){ 
                item.addClass('selected');
            }

            item.click(function(){
                $('#saves li.selected').removeClass('selected');
                activeDoc = name;
                item.addClass('selected');
                render();
            });
            $('#saves').append(item);
        })(i);
    }


    //renderDocs();
    
    $('#Delete').click(function(){
	if(localStorage.hasOwnProperty(activeDoc)){
            delete localStorage[activeDoc];
            $('#saves li.selected').remove();
	}
    });
    
    $('#input').change(function(){
	var files = $(this)[0].files;
	if(files.length < 1 ) return;
	var fname = $(this)[0].files[0].name;
	var reader = new FileReader();
	reader.onload = function(r){
            try{
		diagramState = JSON.parse(r.target.result);
		localStorage[fname] = JSON.stringify(diagramState);
		renderDocs();
            }catch(e){
		console.log('Error loading file');
            }
	}
	reader.readAsText($(this)[0].files[0]);
    });
    
    $('#Export a').click(function(){
	$(this).attr('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(localStorage[activeDoc]));
    });
    
    $('#documents .addlevel').click(function(){
	diagramState = bg_diagram();
	activeDoc = prompt('New diagram name?');
	if(activeDoc == null) return;
	localStorage[activeDoc] = JSON.stringify(diagramState);
	renderDocs();
    });
}


//RAM:  Moved all of this to the kickoff function at the bottom
// Global svg overlay
//$(document).ready(function() {//RAM: Make this happen only after things are loaded and ready
//    paper = Raphael(0,0,640, 480);
//    $('body').append($('<div id="tooltips"></div>'));
///});


// Global diagram state
//if(activeDoc == ''){
//    diagramState = bg_diagram();
//}

// Function to draw a tooltip in the correctplace with correct content
function tooltip ($p, pguide) {
    
    var editing = 0;
    var showing = 0;
    var container = $('<div></div>');
    var guide = pguide;
    
    var tipFunc = function() {
        container.addClass('tooltip')
            .hide()
            .html(typeof(guide.notes) == 'undefined'? '[add content]':guide.notes)
            .click(function(){
                container.attr('contentEditable','true');
            })
            .focusout(function(){
                guide.notes = container.html();
                localStorage[activeDoc] = JSON.stringify(diagramState);
                container.attr('contentEditable','false');
            });
	return tipFunc;
    }
    
    
    tipFunc.position = function(x,y){
	//console.log("Entering Position: editig = " + editing + " showing = " + showing); 
        container.css('top',y).css('left',x);
	//console.log("Exiting Position: editig = " + editing + " showing = " + showing); 
	//console.log("========");
	
	return tipFunc;
    };
    
    tipFunc.toggle = function(){
	//console.log("Toggle: editig = " + editing + " showing = " + showing); 
	// state variable set
	if(showing == 1 && editing ==0 ){
	    editing = 1;
	    container.show();
	}else if(showing == 0 && editing==0){
	    container.slideToggle();
	    editing = 1;
	    showing = 1;
	}
	else if(showing == 1 && editing == 1){
	    editing = 0;
	    showing = 0;
	    container.slideToggle();
	}else if(showing == 0 && editing==1) {
	    alert("Not possible!");
	}
	//console.log("Exiting toggle: editig = " + editing + " showing = " + showing); 
	//console.log("========");
	return tipFunc;
    };
    
    tipFunc.show = function() {
	//console.log("Show: editig = " + editing + " showing = " + showing); 
        if(editing != 1){
	    showing = 1;
	    container.show();
	}
	//console.log("Exiting Show: editig = " + editing + " showing = " + showing); 
	//console.log("========");
	return tipFunc;
    };

    tipFunc.hide = function() {
	//console.log("Hide: editig = " + editing + " showing = " + showing); 
	if(editing == 0){
	    container.hide();
	    showing = 0;
	}
	//console.log("Exiting Hide: editig = " + editing + " showing = " + showing); 
	//console.log("========");
	return tipFunc;
    };	      

    tipFunc.html = function(a){
	if(typeof(a) != 'undefined')
            guide.notes = a;
        return container.html(a);
    }
    
    $p.append(container);
    
    return tipFunc;
};



render_b_diagram = function redrawb (bg_diagram_instance){
    var start = null;
    $('#rendering-context').empty();
    
    function header(text){
        var c = $('<h4></h4>');
        c.html(text);
        return c;
    }

    function ViewBlock(dblock, parent){
        return new (function(){
            var self = this;
            self.parent = parent;
            self.guides = [];
            self.connOffset = 0.0;
            self.connCount = 1.0;
            self.block = dblock;
            self.container = $('<div></div>');
            self.container.addClass('block');

            self.adder = $('<span>+</span>');
            self.adder.addClass('addlevel');
            
            self.close = $('<span>x</span>');
            self.close.addClass('close');

            self.connector = $('<div></div>');
            self.connector.addClass('connector');
            
            self.container.append(self.adder)
                          .append(self.connector)
                          .append(self.close)
                          .append($('<p>'+self.block.notes+'</p>'));
            // self.container.mouseleave(function(e){
            //         $('#canvas').css('pointer-events','all');
            //     })
            //     .mouseover(function(e){
            //         $('#canvas').css('pointer-events','none');
            //     });
            self.adder.click(function(e){
                e.stopPropagation();
                var b = block(Math.random().toString(36).slice(2),'[add content]',[]);
                self.block.content.push(b);
                localStorage[activeDoc] = JSON.stringify(bg_diagram_instance);
                setTimeout(function(){
                        render();
                    },20);
            });

            self.close.click(function(e){
                e.stopPropagation();
                self.container.remove();
                var toRemove = getChildren(self.block).map(function(a){return a.name;});
                toRemove.push(self.block.name);
                for(var i=0; i<bg_diagram_instance._guidelines.length;){
                    var g = bg_diagram_instance._guidelines[i];
                    if($.anyEq( toRemove, [g.from, g.to])){
                        remove(bg_diagram_instance._guidelines, g);
                    }else{
                        i++;
                    }

                }
                // Need to recurse and remove all children's guides.
                remove(self.parent.contents,self.block);
                localStorage[activeDoc] = JSON.stringify(bg_diagram_instance);
                setTimeout(function(){
                        render();
                    },20);
            });

            self.connector.click(function(e){
                e.stopPropagation();
                if(start == null){
                    start = self;
                    self.connector.addClass('selected');
                }
                else if(start == self){
                    start = null;
                    self.connector.removeClass('selected');
                }
                else if(start != null){
                    var guide = guideline(start.block.name, self.block.name,'[add content]');
                    bg_diagram_instance._guidelines.push(guide);
                    localStorage[activeDoc] = JSON.stringify(bg_diagram_instance);
                    start = null;
                    setTimeout(function(){
                            render();
                        },20);
                }
            });

            self.container.click(function(e){
                e.stopPropagation();
                self.container.find('p').first().attr('contentEditable','true');
            }).focusout(function(e){

                e.stopPropagation();
                self.container.find('p').first().attr('contentEditable','false');
                self.block.notes = self.container.find('p').first().html();
                localStorage[activeDoc] = JSON.stringify(diagramState);
            });

            return self;
        })();
    }

    function HeaderBlock(title, clsName, dg_container){
        return new(function(){
            var self = this;
            self.container = $('<div></div>');
            self.container.addClass('block')
                          .addClass(clsName)
                          .append(title);
            self.adder = $('<span>+</span>');
            self.adder.addClass('addlevel');
            self.contents = dg_container;
            self.adder.click(function(e){
                e.stopPropagation();
                var b = block(Math.random().toString(36).slice(2),'[add content]');
                self.contents.push(b);
                localStorage[activeDoc] = JSON.stringify(bg_diagram_instance);
                setTimeout(function(){
                        render();
                    },20);
            });

            self.container.append(self.adder)
            return self;
        })();
    }


    
    var render_blocks = function rec (container, block_list){
        var p = {};
        p.container = container;
        p.contents = block_list;
        for(var i in p.contents){
            (function(block){
                
                var v = ViewBlock(block, p);
                
                if(typeof(block.content) != undefined){
                    rec(v.container,block.content);
                }
                container.append(v.container);
                guideTable[block.name] = {'obj':        v.container, 
                                          'connCount':  0.0, 
                                          'connOffset': 0.0};
            })(block_list[i]);
        }
    }
    
    
    var w = $(window).width()*0.50;
    
    var diagram = $('<div></div>');
    diagram.css('position','relative');
    
    var dc = HeaderBlock(header('Domain Characterization'), 'domain', bg_diagram_instance._domain_characterization);
    dc.container.css('width', w - 160);
    render_blocks(dc.container, bg_diagram_instance._domain_characterization);
    
    var ab = HeaderBlock(header('Abstraction'), 'abstraction', bg_diagram_instance._abstractions);
    ab.container.css('margin-left', 30)
        .css('width', w - 130);
    render_blocks(ab.container, bg_diagram_instance._abstractions);
    
    var et = HeaderBlock(header('Encodings and Techniques'), 'encoding', bg_diagram_instance._encodings);
    et.container.css('margin-left', 60)
        .css('width', w - 100);
    render_blocks(et.container, bg_diagram_instance._encodings);
    
    var al = HeaderBlock(header('Algorithms'), 'algorithm', bg_diagram_instance._algorithms);
    al.container.css('margin-left', 90)
        .css('width', w - 70);
    render_blocks(al.container, bg_diagram_instance._algorithms);
    
    diagram.append(dc.container)
        .append(ab.container)
        .append(et.container)
        .append(al.container);
    
    // initialize the guides with some extra layout information
    for(var i in bg_diagram_instance._guidelines){
        var g = bg_diagram_instance._guidelines[i];
	
        guideTable[g.to]['connCount'] = guideTable[g.to]['connCount'] + 1.0;
        guideTable[g.from]['connCount'] = guideTable[g.from]['connCount'] + 1.0;
    }
    return diagram; 
  }

render_g_diagram = function redrawg (bg_diagram_instance, diagram){
    // Then render the guidelines.
    // Since everything else has to happen (render) in order to resolve 
    //   the positions set a timeout for a few milliseconds after.
    setTimeout(function(){
        paper.clear();
        for(var i in bg_diagram_instance._guidelines){
	    (function(guide){
                var tt = tooltip($('#tooltips'),guide)();
		var from = guideTable[guide.from];
                var to = guideTable[guide.to];
                var parent = from.obj.parents().has(to.obj).first(); // Find the common parent.
                // Random horizontal offset, to avoid doing intelligent (hard) routing
                var hoffset = (Math.random()*50.0);
                // Vertical offsets (heuristic to get decent (non-overlapping) end points)
                var toVoff = (to.connOffset / to.connCount) * to.obj.height();
                var fromVoff = (from.connOffset / from.connCount) * from.obj.height();
                to.connOffset = to.connOffset + 1.0;
                from.connOffset = from.connOffset + 1.0;
                // For short hand while constructing the path -- 
                //   plus we don't really need the other information any more.
                to = to.obj;
                from = from.obj;
		
                // Construct an svg path. Refer to the Raphael docs.
                var d = "M"  + (from.offset().left + from.width() + 4) + " " + (from.offset().top + fromVoff) +
		    " L" + (parent.width() + hoffset)+               " " + (from.offset().top + fromVoff)+
		    // Notice the relative positioning step here. 
		    " l0 "                                               + ((to.offset().top + toVoff) - (from.offset().top + fromVoff)) +
		    " L" + (to.offset().left + to.width() + 4) +     " " + (to.offset().top + toVoff);
                
                // Actually draw the path and set some useful properties.
                var p = paper.path(d);
                p.attr('stroke', 'rgba(50,50,50,0.5)')
		    .attr('stroke-width', '3')
		    .attr('arrow-end', 'classic-wide-long')
                // Show a tooltip at the mouse location with the guide notes.
		    .click(function(event){
			
			
			var mx = event.clientX;
			var my = event.clientY + $(window).scrollTop();
			tt.position(mx + 25, my - 25)
			tt.toggle();
		    })
		    .mouseover(function(event){
			var mx = event.clientX;
			var my = event.clientY + $(window).scrollTop();
			
			tt.position(mx + 25, my - 25);
			tt.show();
		    })
		    .mouseout(function(event) {
			tt.hide();
			
		    });
		
                // Cute hacky workaround for discovering between level guidelines.
                if(from.css('background-color') != to.css('background-color')){
		    p.attr('stroke', 'rgba(0,0,250,0.5)');
                }
	    })(bg_diagram_instance._guidelines[i]);
        }
	
    }, 60)
    return diagram;
}

    
//Main render function
function render(){
    var w = $(window).width();
    var h = $(window).height();
    var diagram = $('#rendering-context');
    diagram.width(w*0.50);

    diagram.empty();
    diagramState = JSON.parse(localStorage[activeDoc]);
    var blocks = render_b_diagram(diagramState);  //RAM:  SHould split this into render block then render guides;  set canvas ,paper, etc. AFTER you render blocks
    diagram.append(blocks);
    $('#canvas').width(w).height($('#rendering-context').height());
    paper.setSize(w*0.60, $('#rendering-context').height());    
   var guides = render_g_diagram(diagramState,blocks);
    diagram.append(guides);
}

$(window).resize(render);

function getUrlVars()
{
    var vars = {}, hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}


// This function kicks everything off!
$(document).ready(function () {
//$(function(){

    // Global svg overlay
    paper = Raphael(0,0,640, 480);
    $('body').append($('<div id="tooltips"></div>'));
    

    // Global diagram state
    if(activeDoc == ''){
	diagramState = bg_diagram();
    }
    

    var diagram = $('#rendering-context');
    diagram.empty();
    var params = getUrlVars();
    if(params.hasOwnProperty('name')){
        activeDoc = params.name;
        if(localStorage.hasOwnProperty(activeDoc)){
            diagramState = JSON.parse(localStorage[activeDoc]);
            localStorage[activeDoc] = JSON.stringify(diagramState);
            renderDocs();
        }else{
            diagramState = bg_diagram();
            localStorage[activeDoc] = JSON.stringify(diagramState);
            renderDocs();
        }
    }else{
        diagramState = bg_diagram();
        activeDoc = prompt('New diagram name?');
        if(activeDoc == null) return;
        localStorage[activeDoc] = JSON.stringify(diagramState);
        renderDocs();
    }

    render();
});
