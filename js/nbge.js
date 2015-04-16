function HeaderBlock(mgmt, title, clsName, dg_container) {
    return new(function() {
        var self = this;

        self.container = $('<div></div>');
        self.container.addClass('block')
            .addClass(clsName)
            .append(title);

        self.adder = $('<span>+</span>');
        self.adder.addClass('addlevel');

        self.contents = dg_container;
        if(typeof(self.contents) == 'undefined') self.contents = [];

        self.adder.click(function(e) {
            e.stopPropagation();
            var b = block(Math.random().toString(36).slice(2), '[add content]');
            self.contents.push(b);
            setTimeout(function() {
                mgmt.trigger_change(true);
            }, 20);
        });

        self.container.append(self.adder)
        return self;
    })();
};

function ViewBlock(mgmt, dblock, parent) {
    return new(function() {
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
            .append($('<p>' + self.block.notes + '</p>'));

        self.adder.click(function(e) {
            e.stopPropagation();
            var b = block(Math.random().toString(36).slice(2), '[add content]', []);
            self.block.content.push(b);
            setTimeout(function() {
                mgmt.trigger_change(true);
            }, 20);
        });

        self.close.click(function(e) {
            e.stopPropagation();
            self.container.remove();
            // Need to recurse and remove all children's guides.
            var toRemove = getChildren(self.block).map(function(a) {
                return a.name;
            });
            toRemove.push(self.block.name);
            for (var i = 0; i < mgmt.diagram()._guidelines.length;) {
                var g = mgmt._state._guidelines[i];
                if ($.anyEq(toRemove, [g.from, g.to])) {
                    remove(mgmt._state._guidelines, g);
                } else {
                    i++;
                }
            }
            // Remove this block from the parent.
            remove(self.parent.contents, self.block);
            // Store diagram state.
            setTimeout(function() {
                mgmt.trigger_change(true);
            }, 20);
        });

        self.connector.click(function(e) {
            e.stopPropagation();
            if (mgmt._guide_state == null) {
                mgmt._guide_state = self;
                self.connector.addClass('selected');
            } else if (mgmt._guide_state == self) {
                mgmt._guide_state = null;
                self.connector.removeClass('selected');
            } else if (mgmt._guide_state != null) {
                var guide = guideline(mgmt._guide_state.block.name, self.block.name, '[add content]');
                mgmt._state._guidelines.push(guide);
                mgmt._guide_state = null;
                setTimeout(function() {
                    mgmt.trigger_change(true);
                }, 20);
            }
        });

        self.container.click(function(e) {
            e.stopPropagation();
            self.container.find('p').first().attr('contentEditable', 'true');
        }).focusout(function(e) {
            e.stopPropagation();
            self.container.find('p').first().attr('contentEditable', 'false');
            self.block.notes = self.container.find('p').first().html();
            mgmt.trigger_change(true);
        });

        return self;
    })();
};

// Tooltips for guidelines
function tooltip(mgmt, $p, pguide) {
    return new(function() {
        var self = this;
        var editing = false;
        var showing = false;
        var container = $('<div></div>');
        var content = $('<p></p>');
        var guide = pguide;

        self.close = $('<span>x</span>')
        self.close.addClass('close');

        content.click(function(e) {
                e.stopPropagation();
                content.attr('contentEditable', 'true');
            })
            .focusout(function() {
                guide.notes = content.html();
                mgmt.trigger_change();
                content.attr('contentEditable', 'false');
            })
            .html(typeof(guide.notes) == 'undefined' ? '[add content]' : guide.notes);

        container.addClass('tooltip')
            .hide()
            .append(content)
            .append(self.close);

        self.position = function(x, y) {
            //console.log("Entering Position: editig = " + editing + " showing = " + showing); 
            container.css('top', y).css('left', x);
            //console.log("Exiting Position: editig = " + editing + " showing = " + showing); 
            //console.log("========");
            return self;
        };

        self.toggle = function() {
            if (showing && !editing) {
                editing = !editing;
                container.show();
            } else if (!showing && !editing) {
                container.slideToggle();
                editing = !editing;
                showing = !showing;
            } else if (showing && editing) {
                editing = !editing;
                showing = !showing;
                container.slideToggle();
            } else if (!showing && editing) {
                alert("Not possible!");
            }
            return self;
        };

        self.show = function() {
            //console.log("Show: editig = " + editing + " showing = " + showing); 
            if (!editing) {
                showing = true;
                container.show();
            }
            //console.log("Exiting Show: editig = " + editing + " showing = " + showing); 
            //console.log("========");
            return self;
        };

        self.hide = function() {
            //console.log("Hide: editig = " + editing + " showing = " + showing); 
            if (!editing) {
                container.hide();
                showing = false;
            }
            //console.log("Exiting Hide: editig = " + editing + " showing = " + showing); 
            //console.log("========");
            return self;
        };

        self.html = function(a) {
            if (typeof(a) != 'undefined') {
                guide.notes = a;
            }
            return content.html(a);
        }

        self.remove = function() {
            container.parent().find(container).remove();
        }

        $p.append(container);

        return self;
    })();
};

nbge = function() {
    return new(function() {

        var self = this;

        var _parent = null;

        var _change_hooks = [];

        var _change_recorded = false;

        var $diagram = $('<div></div>');
        $diagram.addClass('nbge-rendering-context')

        var $tooltip_layer = $('<div></div>');
        $tooltip_layer.addClass('nbge-tooltips');
        
        var paper = null;
        
        self._state = null;

        self._guide_state = null;

        self.diagram_changed = function(f) {
            _change_hooks.push(f);
            return self;
        }

        self.remove_change_event = function(f) {
            remove(_change_hooks, f);
            return self;
        }

        self.parent = function($p) {
            if (typeof($p) === 'undefined')
                return _parent;
            else {
                _parent = $p;
                _parent.append($tooltip_layer).append($diagram);
                
                paper = Raphael(_parent[0], 640, 480);
                
            }
            return self
        };

        self.diagram = function(d) {
            if (typeof(d) === 'undefined')
                return self._state
            else{
                self._state = d;
                // Consider removing change handlers.
                self.render();
            }
            return self;
        };

        self.trigger_change = function(rerender) {
            if (!_change_recorded)
                _change_recorded = true;
            if(rerender)
                self.render();
            for(var i in _change_hooks){
                (function(f){
                    f();
                })(_change_hooks[i]);
            }
            return self;
        }

        var render_blocks = function redrawb() {

            function header(text) {
                var c = $('<h4></h4>');
                c.html(text);
                return c;
            }

            // Initialize a new lookup table for the guidelines.
            var guideTable = {};
            var render_blocks = function rec(container, block_list) {
                var p = {};
                p.container = container;
                p.contents = block_list;
                for (var i in p.contents) {
                    (function(block) {

                        var v = ViewBlock(self ,block, p);

                        if (typeof(block.content) != undefined) {
                            rec(v.container, block.content);
                        }
                        container.append(v.container);
                        guideTable[block.name] = {
                            'obj': v.container,
                            'connCount': 0.0,
                            'connOffset': 0.0
                        };
                    })(block_list[i]);
                }
            }


            var w = $(window).width() * 0.50;

            var diagram = $('<div></div>');
            diagram.css('position', 'relative');

            var dc = HeaderBlock(self, header('Domain Characterization'), 'domain', self._state._domain_characterization);
            dc.container.css('width', w - 160);
            render_blocks(dc.container, self._state._domain_characterization);

            var ab = HeaderBlock(self, header('Abstraction'), 'abstraction', self._state._abstractions);
            ab.container.css('margin-left', 30)
                .css('width', w - 130);
            render_blocks(ab.container, self._state._abstractions);

            var et = HeaderBlock(self, header('Encodings and Techniques'), 'encoding', self._state._encodings);
            et.container.css('margin-left', 60)
                .css('width', w - 100);
            render_blocks(et.container, self._state._encodings);

            var al = HeaderBlock(self, header('Algorithms'), 'algorithm', self._state._algorithms);
            al.container.css('margin-left', 90)
                .css('width', w - 70);
            render_blocks(al.container, self._state._algorithms);

            diagram.append(dc.container)
                .append(ab.container)
                .append(et.container)
                .append(al.container);

            // initialize the guides with some extra layout information
            for (var i in self._state._guidelines) {
                var g = self._state._guidelines[i];

                guideTable[g.to]['connCount'] = guideTable[g.to]['connCount'] + 1.0;
                guideTable[g.from]['connCount'] = guideTable[g.from]['connCount'] + 1.0;
            }
            return {
                'diagram': diagram,
                'guideTable': guideTable
            };
        };

        var render_guides = function redrawg(guideTable) {
            // Clearing the paper rather than mutating existing guides.
            paper.clear();
            for (var i in self._state._guidelines) {
                (function(guide) {
                    var tt = tooltip(self, $tooltip_layer, guide);
                    tt.close.click(function(e) {
                        e.stopPropagation();
                        remove(self._state._guidelines, guide);
                        self.trigger_change();
                        tt.remove();
                    });
                    var from = guideTable[guide.from];
                    var to = guideTable[guide.to];
                    var parent = from.obj.parents().has(to.obj).first(); // Find the common parent.
                    // Random horizontal offset, to avoid doing intelligent (hard) routing
                    var hoffset = (Math.random() * -30.0);
                    // Vertical offsets (heuristic to get decent (non-overlapping) end points)
                    var toVoff = (to.connOffset / to.connCount) * to.obj.height() - parent.offset().top + 5;
                    var fromVoff = (from.connOffset / from.connCount) * from.obj.height() - parent.offset().top + 5;
                    to.connOffset = to.connOffset + 1.0;
                    from.connOffset = from.connOffset + 1.0;
                    // For short hand while constructing the path -- 
                    //   plus we don't really need the other information any more.
                    to = to.obj;
                    from = from.obj;

                    // Construct an svg path. Refer to the Raphael docs.
                    var d = "M" + (from.offset().left + from.width() + 4) + " " + (from.offset().top + fromVoff) +
                        " L" + (parent.width() + hoffset) + " " + (from.offset().top + fromVoff) +
                        // Notice the relative positioning step here. 
                        " l0 " + ((to.offset().top + toVoff) - (from.offset().top + fromVoff)) +
                        " L" + (to.offset().left + to.width() + 4) + " " + (to.offset().top + toVoff);

                    // Actually draw the path and set some useful properties.
                    var p = paper.path(d);
                    p.attr('stroke', 'rgba(50,50,50,0.5)')
                        .attr('stroke-width', '3')
                        .attr('arrow-end', 'classic-wide-long')
                        // Show a tooltip at the mouse location with the guide notes.
                        .click(function(event) {
                            var mx = event.clientX;
                            var my = event.clientY + $(window).scrollTop();
                            tt.position(mx + 25, my - 25)
                            tt.toggle();
                        })
                        .mouseover(function(event) {
                            var mx = event.clientX;
                            var my = event.clientY + $(window).scrollTop();

                            tt.position(mx + 25, my - 25);
                            tt.show();
                        })
                        .mouseout(function(event) {
                            tt.hide();

                        });
                    // Cute hacky workaround for discovering between level guidelines.
                    if (from.css('background-color') != to.css('background-color')) {
                        p.attr('stroke', 'rgba(0,0,250,0.5)');
                    }
                })(self._state._guidelines[i]);
            }
        };

        //Main render function
        self.render = function render() {
            var w = _parent.width();
            var h = _parent.height();

            $diagram.empty();
            $tooltip_layer.empty();
            $diagram.width(w * 0.9);

            var blockResult = render_blocks();
            $diagram.append(blockResult.diagram);

            var rch = $diagram.height();
            $('#canvas').width(w).height(rch);
            paper.setSize(w, rch);
            $(paper.canvas).css('position','absolute').css('top',$diagram.offset().top)
            blockResult.diagram.width(w, rch);
            
            pollUntil($(paper.canvas)).predicate(function($c) {
                return $c.height() == rch;
            }).done(function() {
                render_guides(blockResult.guideTable);
            }).run();
        };
    })();
};
